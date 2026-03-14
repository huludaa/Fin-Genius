import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Space, Checkbox, message, Typography, Divider } from 'antd';
import { useAppDispatch } from '@/store/hooks';
import { createTemplate, updateTemplate } from '@/store/slices/promptTemplateSlice';
import VariableDefinition, { Variable } from './VariableDefinition';

const { Title, Text, Paragraph } = Typography;

interface PromptFormProps {
    initialValues?: any;
    onSuccess?: () => void;
    onCancel?: () => void;
    readOnly?: boolean;
    isAdmin?: boolean;
}

const PromptForm: React.FC<PromptFormProps> = ({
    initialValues,
    onSuccess,
    onCancel,
    readOnly = false,
    isAdmin = false
}) => {
    const [form] = Form.useForm();
    const [variables, setVariables] = useState<Variable[]>([]);
    const textareaRef = React.useRef<any>(null);
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue({
                ...initialValues,
                is_official: initialValues.is_official || false
            });
            if (initialValues.variables) {
                setVariables(initialValues.variables);
            }
        } else {
            form.resetFields();
            setVariables([]);
        }
    }, [initialValues, form]);

    const onFinish = async (values: any) => {
        try {
            // 验证变量
            if (variables.length > 0) {
                for (let i = 0; i < variables.length; i++) {
                    const v = variables[i];
                    const num = i + 1;

                    if (!v.name || !v.name.trim()) {
                        throw new Error(`变量 ${num}: 变量名是必填项`);
                    }
                    if (!/^[a-zA-Z0-9_]+$/.test(v.name)) {
                        throw new Error(`变量 ${num}: 变量名只能包含英文、数字和下划线`);
                    }
                    if (!v.label || !v.label.trim()) {
                        throw new Error(`变量 ${num}: 显示名称是必填项`);
                    }
                    if (!v.type) {
                        throw new Error(`变量 ${num}: 请选择输入类型`);
                    }

                    if (v.type === 'select' || v.type === 'multi-select') {
                        if (!v.options || v.options.length === 0) {
                            throw new Error(`变量 ${num} (${v.label}): 请至少配置一个选项`);
                        }
                        if (v.options.some(opt => !opt.value || !opt.value.trim())) {
                            throw new Error(`变量 ${num} (${v.label}): 所有选项值均不能为空`);
                        }
                    }
                }
            }

            const payload = {
                ...values,
                variables: variables
            };

            if (initialValues?.id) {
                await dispatch(updateTemplate({ id: initialValues.id, data: payload })).unwrap();
                message.success('模板更新成功');
            } else {
                await dispatch(createTemplate(payload)).unwrap();
                message.success('模板创建成功');
            }
            onSuccess?.();
        } catch (err: any) {
            message.error(err.message || '操作失败');
        }
    };

    return (
        <div style={{ paddingBottom: '80px', position: 'relative' }}>
            <Title level={4} style={{ marginBottom: 24 }}>
                {readOnly ? '查看模板' : (initialValues ? '编辑模板' : '创建新模板')}
            </Title>

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                disabled={readOnly}
                initialValues={{ is_official: false }}
            >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                    <Form.Item
                        name="template_name"
                        label="模板名称"
                        rules={[{ required: true, message: '请输入模板名称' }]}
                    >
                        <Input placeholder="例如：消金产品朋友圈文案生成" size="large" />
                    </Form.Item>

                    {isAdmin && (
                        <Form.Item name="is_official" valuePropName="checked" style={{ paddingTop: '32px' }}>
                            <Checkbox>设为官方模板 (全员可见)</Checkbox>
                        </Form.Item>
                    )}
                </div>

                <Form.Item
                    name="description"
                    label="模板描述"
                    rules={[{ required: true, message: '请输入模板描述' }]}
                >
                    <Input.TextArea placeholder="扼要说明此模板的用途和适用场景" autoSize={{ minRows: 2 }} />
                </Form.Item>

                <Divider orientation="left">变量定义</Divider>
                <Paragraph type="secondary">
                    定义用户在使用此模板时需要填写的动态参数。在下方“提示词内容”中通过 <code>{'{变量名}'}</code> 的形式进行引用。
                </Paragraph>

                <VariableDefinition
                    variables={variables}
                    onChange={setVariables}
                    readOnly={readOnly}
                />

                <Divider orientation="left" style={{ marginTop: 32 }}>提示词内容</Divider>
                {!readOnly && (
                    <div style={{ marginBottom: 12 }}>
                        <Text type="secondary" style={{ fontSize: '13px', display: 'block', marginBottom: 8 }}>
                            点击变量名快速插入正文：
                        </Text>
                        <Space wrap>
                            {variables.map((v, i) => (
                                <Button
                                    key={i}
                                    size="small"
                                    disabled={!v.name}
                                    onClick={() => {
                                        const textArea = textareaRef.current?.resizableTextArea?.textArea; // React + UI 组件库（AntD 等）中，安全获取原生文本域 DOM
                                        const currentContent = form.getFieldValue('template_content') || '';
                                        const variableTag = `{${v.name}}`;

                                        if (textArea) {
                                            const start = textArea.selectionStart; // 获取文本框内当前选中文字的【起始光标位置】。
                                            const end = textArea.selectionEnd; // 获取文本框内当前选中文字的【结束光标位置】。
                                            const newContent = currentContent.substring(0, start) + variableTag + currentContent.substring(end); // 在当前选中文字的【起始光标位置】前插入变量标签。

                                            form.setFieldsValue({
                                                template_content: newContent
                                            });

                                            /* 
                                            强制让文本框在当前所有同步代码执行完毕、DOM 渲染完成后，再执行聚焦和光标定位操作。
                                            */
                                            setTimeout(() => {
                                                textArea.focus(); // 让文本框获得焦点。
                                                textArea.setSelectionRange(start + variableTag.length, start + variableTag.length); // 将光标定位到变量标签的后面。
                                            }, 0);
                                        }
                                        // 如果拿不到 textArea，代码就不知道“用户光标在哪”，就直接把 {变量名} 接在当前所有文字的最末尾。
                                        else {
                                            form.setFieldsValue({
                                                template_content: currentContent + variableTag
                                            });
                                        }
                                    }}
                                    style={{ borderRadius: '6px', fontSize: '12px' }}
                                >
                                    {v.label || `变量${i + 1}`}
                                </Button>
                            ))}
                            {variables.length === 0 && <Text type="secondary" style={{ fontSize: '12px' }}>请先在上方定义变量</Text>}
                        </Space>
                    </div>
                )}
                <Form.Item
                    name="template_content"
                    label="提示词正文"
                    rules={[{ required: true, message: '请输入提示词内容' }]}
                    extra="使用 {变量名} 来标记需要动态替换的位置"
                >
                    <Input.TextArea
                        ref={textareaRef}
                        placeholder="例如：请作为一名资深金融理财经理，为我的客户编写一段关于{产品名称}的朋友圈推广文案..."
                        autoSize={{ minRows: 10 }}
                        style={{ fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.6' }}
                    />
                </Form.Item>

                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '16px 24px',
                    background: '#fff',
                    borderTop: '1px solid #f0f0f0',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 12,
                    zIndex: 10
                }}>
                    <Button onClick={onCancel}>
                        {readOnly ? '关闭' : '取消'}
                    </Button>
                    {!readOnly && (
                        <Button type="primary" htmlType="submit">
                            {initialValues ? '保存修改' : '立即创建'}
                        </Button>
                    )}
                </div>
            </Form>
        </div>
    );
};

export default PromptForm;