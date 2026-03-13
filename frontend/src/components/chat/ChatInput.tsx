import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Input, Button, Upload, Space, Select, Tag, Modal, Spin, message as antdMessage } from 'antd';
import { SendOutlined, UploadOutlined, StopOutlined, PaperClipOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addMessage, startStreaming, appendToLastMessage, endStreaming, setLoading, updateLastMessageId, updateMessageCompliance, updateUserMessageId, updateComplianceStatus } from '@/store/slices/chatSlice';
import { fetchTemplates } from '@/store/slices/promptTemplateSlice';
import { fetchConversations, saveMessage, createNewConversation, setCurrentConversationId } from '@/store/slices/conversationSlice';
import api from '@/lib/axios';

const { TextArea } = Input;

interface ChatInputProps {
    activeTemplate?: any;
    onTemplateSelect?: (template: any) => void;
    templateVariables?: Record<string, string>;
}

const ChatInput: React.FC<ChatInputProps> = ({ activeTemplate, onTemplateSelect, templateVariables }) => {
    const [prompt, setPrompt] = useState('');
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [fileList, setFileList] = useState<any[]>([]);
    const [parsingFiles, setParsingFiles] = useState<Record<string, boolean>>({});

    const abortControllerRef = useRef<AbortController | null>(null);
    const stopReasonRef = useRef<'manual' | 'new_message' | 'page_switch' | null>(null);

    const dispatch = useAppDispatch();
    const { status, messages } = useAppSelector((state) => state.chat);
    const { templates } = useAppSelector((state) => state.promptTemplates);
    const { currentConversationId } = useAppSelector((state) => state.conversations);

    const router = useRouter();

    useEffect(() => {
        dispatch(fetchTemplates());
    }, [dispatch]);

    // 停止生成逻辑
    const handleStop = (reason: 'manual' | 'new_message' | 'page_switch' = 'manual') => {
        if (abortControllerRef.current) {
            stopReasonRef.current = reason;
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        dispatch(endStreaming());
        dispatch(setLoading(false));
    };

    // 新增：处理文件选择并立即触发后端解析
    const handleFileChange = async ({ file, fileList: newFileList }: any) => {
        setFileList(newFileList);

        // 如果是新选中的文件且尚未解析
        if (file.status !== 'removed' && !file.parsedContent) {
            const uid = file.uid;
            setParsingFiles(prev => ({ ...prev, [uid]: true })); // [uid]把当前uid的内容拿出来，当作对象的键名。true表示正在解析。

            try {
                const formData = new FormData();
                formData.append('file', file.originFileObj || file);
                const res = await api.post('/ai/parse-file', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                // 更新文件对象，填入解析后的文本内容
                setFileList(prev => prev.map(f =>
                    f.uid === uid ? { ...f, parsedContent: res.data.content, status: 'done' } : f
                ));
            } catch (e) {
                console.error("解析错误", e);
                antdMessage.error(`${file.name} 解析失败，请重试`);
                setFileList(prev => prev.filter(f => f.uid !== uid));
            } finally {
                setParsingFiles(prev => ({ ...prev, [uid]: false }));
            }
        }
    };

    const handleSend = async () => {
        if (status === 'streaming' || status === 'generating') {
            handleStop('new_message');
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // 检查是否有文件正在解析中
        // Object.values() 方法返回一个数组，包含对象中所有可枚举属性的值。
        // some() 方法测试数组中是否至少有一个元素通过了由提供的函数实现的测试。
        const isParsing = Object.values(parsingFiles).some(v => v);
        if (isParsing) {
            antdMessage.loading("正在解析文档，请稍候...");
            return;
        }

        // 没有输入，没有模板，没有文件，直接返回
        if (!prompt.trim() && !activeTemplate && fileList.length === 0) return;

        const token = localStorage.getItem('token');
        if (!token) {
            antdMessage.error("未找到登录信息，请重新登录。");
            router.push('/login');
            return;
        }

        // 合并所有已解析的文件内容
        let contextFromFile = "";
        const parsedContents = fileList
            .filter(f => f.parsedContent)
            .map(f => `[文档: ${f.name}]\n${f.parsedContent}`);

        if (parsedContents.length > 0) {
            contextFromFile = "\n\n[附件内容]:\n" + parsedContents.join("\n---\n");
        }

        let finalContent = prompt;
        if (activeTemplate && activeTemplate.template_content) {
            let content = activeTemplate.template_content;
            let variableContext = "";
            const missingRequired: string[] = []; // 存储必填项名称的数组

            if (templateVariables) {
                activeTemplate.variables?.forEach((v: any) => {
                    const value = templateVariables[v.name];
                    if (value) {
                        // 替换变量占位符
                        content = content.split(`{${v.name}}`).join(value);

                        // 捕捉描述信息以增强 AI 背景上下文
                        const optionDesc = v.options?.find((opt: any) => opt.value === value)?.description;
                        if (v.description || optionDesc) {
                            variableContext += `\n- ${v.label || v.name}${v.description ? ` (${v.description})` : ""}: ${value}${optionDesc ? ` -> 含义说明: ${optionDesc}` : ""}`;
                        }
                    } else if (v.required) {
                        missingRequired.push(v.label || v.name);
                    } else {
                        // 对于未填写的选填项，将占位符替换为“不作要求”
                        content = content.split(`{${v.name}}`).join("不作要求");
                    }
                });
            }

            if (missingRequired.length > 0) {
                antdMessage.error(`请填写必填项: ${missingRequired.join(', ')}`);
                return;
            }

            if (variableContext) {
                finalContent = `[背景信息 - 模板项说明]:${variableContext}\n\n${content}`;
            } else {
                finalContent = content;
            }

            finalContent += (prompt ? `\n\n具体需求: ${prompt}` : "");
        }

        finalContent += contextFromFile;

        let displayContent = prompt;
        if (fileList.length > 0) {
            const fileNames = fileList.map(f => `[${f.name}]`).join(' ');
            displayContent = (prompt ? `${prompt}\n\n` : "") + `附带文档: ${fileNames}`;
        }

        if (!displayContent && activeTemplate) {
            displayContent = `使用模板: ${activeTemplate.template_name}`;
        }

        setPrompt('');
        setFileList([]);
        setParsingFiles({});
        stopReasonRef.current = null;

        dispatch(addMessage({ role: 'user', content: displayContent, type: 'text' }));
        dispatch(setLoading(true));

        let effectiveId = currentConversationId; // 获取当前对话ID
        const queryId = router.query.id as string; // 获取URL中的对话ID
        if (!effectiveId && queryId) effectiveId = parseInt(queryId); // 

        // 如果没有对话ID，说明在“新对话”页面
        if (!effectiveId) {
            const newConvAction: any = await dispatch(createNewConversation("新对话")); // 创建新对话
            effectiveId = newConvAction.payload?.id; // 获取新对话的ID
            if (effectiveId) {
                dispatch(setCurrentConversationId(effectiveId)); // 设置当前对话ID
                router.replace(`/chat?id=${effectiveId}`, undefined, { shallow: true }); // 更新URL
            }
        }

        if (!effectiveId) {
            antdMessage.error("无法初始化对话，请检查网络连接。");
            dispatch(setLoading(false));
            return;
        }

        // 立即保存用户消息到相对应的对话中，以获取消息的ID，从而实时启用复制/收藏功能
        const saveUserResult: any = await dispatch(saveMessage({ id: effectiveId, role: 'user', content: displayContent })); // 这里的id是对话ID
        if (saveUserResult?.payload?.id) { // 如果保存成功，更新用户消息的ID
            dispatch(updateUserMessageId({ content: displayContent, id: saveUserResult.payload.id }));
        }

        /*new AbortController()
        浏览器提供的原生对象，专门用来手动中断 fetch 请求、异步任务。
        它自带两个核心东西：
        controller.signal：中断信号（传给异步任务，监听中断指令）
        controller.abort()：中断方法（手动调用，立刻终止任务） */
        const controller = new AbortController();

        /* abortControllerRef 是 useRef() 创建的引用
        把控制器存到 ref 里，是为了在组件的任何地方（清理函数、点击事件、其他函数）都能拿到这个实例，随时调用 abort() 终止操作。 */
        abortControllerRef.current = controller;

        let fullResponse = "";
        let isFirstStore = true; // 是否是第一次存储

        try {
            const validHistory = messages.filter(m => m.type === 'text' && (m.role === 'user' || m.role === 'assistant'));
            const payloadHistory = validHistory.map(m => ({ role: m.role, content: m.content }));

            const response = await fetch(`${api.defaults.baseURL}/ai/generate-content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    prompt: finalContent,
                    history: payloadHistory
                }),
                signal: controller.signal
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || "SERVICE_ERROR");
            }

            const reader = response.body!.getReader(); // 获取响应体，getReader()返回一个Reader对象，用于流式读取
            const decoder = new TextDecoder(); // 创建文本解码器

            while (true) {
                const { value, done } = await reader.read(); // 读取响应体
                if (done) break; // 如果读取完成，退出循环
                const chunk = decoder.decode(value, { stream: true }); // 解码响应体

                if (isFirstStore) {
                    dispatch(startStreaming(chunk)); // 开始流式传输
                    isFirstStore = false;
                } else {
                    dispatch(appendToLastMessage(chunk)); // 追加到最后一条消息
                }
                fullResponse += chunk;
            }

            const saveAssistantResult: any = await dispatch(saveMessage({ id: effectiveId, role: 'assistant', content: fullResponse }));

            if (saveAssistantResult?.payload?.id) {
                const assistantId = saveAssistantResult.payload.id;
                dispatch(updateLastMessageId(assistantId));

                // 自动触发合规性检查
                try {
                    dispatch(updateComplianceStatus({ id: assistantId, status: 'pending' }));
                    const compRes = await api.post('/ai/compliance-check', {
                        text: fullResponse,
                        message_id: assistantId
                    });
                    if (compRes.data) {
                        dispatch(updateMessageCompliance({
                            id: assistantId,
                            compliance_result: JSON.stringify(compRes.data)
                        }));
                    }
                } catch (e) {
                    console.error("合规性检查失败", e);
                    dispatch(updateComplianceStatus({ id: assistantId, status: 'completed' }));
                }
            }
            dispatch(fetchConversations()); // 刷新对话列表，更新对话顺序

        } catch (err: any) {
            if (err.name === 'AbortError') {
                if (stopReasonRef.current === 'manual' || stopReasonRef.current === 'new_message' || stopReasonRef.current === 'page_switch') {
                    await dispatch(saveMessage({ id: effectiveId, role: 'user', content: displayContent }));
                    if (fullResponse) {
                        const savePartial: any = await dispatch(saveMessage({ id: effectiveId, role: 'assistant', content: fullResponse }));
                        if (savePartial?.payload?.id) dispatch(updateLastMessageId(savePartial.payload.id));
                    }
                }
            } else {
                const errorDisplay = "\n\n*发生错误，请重试。*";
                dispatch(appendToLastMessage(errorDisplay));
                await dispatch(saveMessage({ id: effectiveId, role: 'user', content: displayContent }));
                await dispatch(saveMessage({ id: effectiveId, role: 'assistant', content: fullResponse + errorDisplay }));
            }
        } finally {
            abortControllerRef.current = null;
            dispatch(endStreaming());
            dispatch(setLoading(false));
            dispatch(fetchConversations());
        }
    };

    return (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', position: 'relative' }}>
            {/* 文件上传按钮 */}
            <Upload
                fileList={fileList}
                onChange={handleFileChange}
                beforeUpload={() => false}
                showUploadList={false}
            >
                <Button
                    size="large"
                    icon={<PaperClipOutlined style={{ fontSize: '20px', color: '#64748b' }} />}
                    style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '16px',
                        border: '1px solid #eef1f4',
                        background: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                    }}
                />
            </Upload>

            {/* 输入框主体 */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                background: '#f4f7f9',
                borderRadius: '24px',
                padding: '4px 8px 4px 16px',
                border: '1px solid #eef1f4',
                transition: 'all 0.3s',
                position: 'relative'
            }}>
                {/* 文件预览标签 */}
                {fileList.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, padding: '8px 0 4px', flexWrap: 'wrap' }}>
                        {fileList.map((file, idx) => (
                            <Tag
                                key={file.uid || idx}
                                closable
                                onClose={() => setFileList(fileList.filter((_, i) => i !== idx))}
                                style={{
                                    borderRadius: '8px',
                                    background: '#fff',
                                    border: '1px solid #e2e8f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4
                                }}
                            >
                                {parsingFiles[file.uid] && <Spin size="small" style={{ marginRight: 4 }} />}
                                {file.name}
                                {parsingFiles[file.uid] ? " (解析中...)" : ""}
                            </Tag>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <TextArea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={activeTemplate ? "请输入具体细节或要求以配合模板生成..." : "在此输入您的消息..."}
                        autoSize={{ minRows: 1, maxRows: 6 }}
                        style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: '10px 0', fontSize: '15px' }}
                        onPressEnter={(e) => {
                            if (!e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <Button
                        type="text"
                        shape="circle"
                        disabled={status !== 'streaming' && status !== 'generating' && !prompt.trim() && !activeTemplate && fileList.length === 0}
                        icon={status === 'streaming' || status === 'generating' ? <StopOutlined style={{ color: '#ff4d4f' }} /> : <SendOutlined style={{ color: '#2563EB', fontSize: '18px' }} />}
                        onClick={() => (status === 'streaming' || status === 'generating' ? handleStop('manual') : handleSend())}
                        style={{ background: '#eef1f4', marginLeft: '8px', width: '36px', height: '36px' }}
                    />
                </div>
            </div>

            {/* 模板选择器按钮 */}
            <div style={{ position: 'relative' }}>
                <Button
                    size="large"
                    icon={<AppstoreOutlined style={{ fontSize: '18px' }} />}
                    onClick={() => setIsSelectorOpen(!isSelectorOpen)}
                    style={{
                        borderRadius: '16px',
                        height: '52px',
                        padding: '0 24px',
                        fontWeight: 600,
                        backgroundColor: activeTemplate ? '#2563EB' : '#fff',
                        color: activeTemplate ? '#fff' : '#0a0a0a',
                        border: '1px solid #eef1f4',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        minWidth: '100px'
                    }}
                >
                    模板
                </Button>

                {/* 模板选择器面板 */}
                {isSelectorOpen && (
                    <div style={{
                        position: 'absolute',
                        bottom: '70px',
                        right: 0,
                        width: '500px',
                        background: '#fff',
                        borderRadius: '20px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                        padding: '24px',
                        zIndex: 100,
                        border: '1px solid #f0f0f0',
                        animation: 'popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <span style={{ fontWeight: 700, fontSize: '16px' }}>选择模板</span>
                            <Button type="text" icon="✕" onClick={() => setIsSelectorOpen(false)} />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {templates.map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => {
                                        onTemplateSelect?.(t);
                                        setIsSelectorOpen(false);
                                    }}
                                    style={{
                                        padding: '16px 20px',
                                        borderRadius: '12px',
                                        border: '1px solid #f0f0f0',
                                        cursor: 'pointer',
                                        flex: '1 0 45%',
                                        transition: 'all 0.2s',
                                        textAlign: 'center',
                                        fontWeight: 500,
                                        fontSize: '14px'
                                    }}
                                    onMouseOver={(e) => (e.currentTarget.style.borderColor = '#2563EB')}
                                    onMouseOut={(e) => (e.currentTarget.style.borderColor = '#f0f0f0')}
                                >
                                    {t.template_name}
                                </div>
                            ))}
                            <div
                                onClick={() => {
                                    onTemplateSelect?.(null);
                                    setIsSelectorOpen(false);
                                }}
                                style={{
                                    padding: '16px 20px',
                                    borderRadius: '12px',
                                    border: '1px dashed #ccc',
                                    cursor: 'pointer',
                                    flex: '1 0 45%',
                                    transition: 'all 0.2s',
                                    textAlign: 'center',
                                    color: '#999',
                                    fontSize: '14px'
                                }}
                            >
                                不使用模板
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes popIn {
                    from { transform: scale(0.9) translateY(10px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default ChatInput;
