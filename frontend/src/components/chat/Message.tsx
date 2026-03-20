import React from 'react';
import { Avatar, Space, Button, Tooltip, Spin, message as antdMessage } from 'antd';
import { UserOutlined, RobotOutlined, StarOutlined, StarFilled, CopyOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { useAppDispatch } from '@/store/hooks';
import { updateMessageStar } from '@/store/slices/conversationSlice';

interface MessageProps {
    id?: number;
    role: 'user' | 'assistant' | 'system';
    content: string;
    isStarred?: boolean;
    complianceResult?: string;
    complianceStatus?: 'pending' | 'completed' | 'none';
    type?: 'text' | 'error' | 'loading';
}

const Message: React.FC<MessageProps> = ({ id, role, content, isStarred, complianceResult, complianceStatus, type }) => {
    const dispatch = useAppDispatch();

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        antdMessage.success('已复制到剪贴板');
    };

    const handleToggleStar = async () => {
        if (!id) return;
        try {
            const newStatus = !isStarred;
            await dispatch(updateMessageStar({ messageId: id, is_starred: newStatus })).unwrap();
            antdMessage.success(newStatus ? '已收藏' : '已取消收藏');
        } catch (err) {
            antdMessage.error('操作失败');
        }
    };

    const isUser = role === 'user';

    return (
        <div
            id={id ? `msg-${id}` : undefined}
            style={{
                display: 'flex',
                gap: '16px',
                maxWidth: '85%',
                flexDirection: isUser ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                animation: 'fadeIn 0.3s ease-in-out'
            }}
        >
            <Avatar
                icon={isUser ? <UserOutlined /> : <RobotOutlined />}
                style={{
                    backgroundColor: isUser ? '#67aa95ff' : '#94a3b8',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
            />

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                gap: '8px'
            }}>
                <div className={`message-bubble ${isUser ? 'user' : 'assistant'} ${type === 'loading' ? 'loading' : ''}`} style={{
                    padding: '12px 18px',
                    borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                    lineHeight: '1.6',
                    fontSize: '15px',
                    position: 'relative'
                }}>
                    {type === 'loading' ? (
                        <div style={{ display: 'flex', gap: '8px', padding: '10px 4px', alignItems: 'center' }}>
                            <div className="dot-pulse" />
                            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>思考过程中...</span>
                        </div>
                    ) : (
                        <div className="markdown-content">
                            <ReactMarkdown>{content}</ReactMarkdown>
                        </div>
                    )}

                    {complianceStatus === 'pending' && (
                        <div style={{
                            marginTop: '12px',
                            paddingTop: '8px',
                            borderTop: '1px solid rgba(0,0,0,0.05)',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#94a3b8'
                        }}>
                            <Spin size="small" style={{ transform: 'scale(0.8)' }} /> 合规检测中...
                        </div>
                    )}

                    {complianceStatus !== 'pending' && complianceResult && (() => {
                        try {
                            const result = JSON.parse(complianceResult);
                            const isCompliant = result.is_compliant !== false;

                            return (
                                <div style={{
                                    marginTop: '12px',
                                    paddingTop: '8px',
                                    borderTop: '1px solid rgba(0,0,0,0.05)',
                                    fontSize: '12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    color: isCompliant ? '#10b981' : '#ef4444'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                        {isCompliant ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                                        {isCompliant ? '合规检测已通过' : '合规建议：需改进'}
                                    </div>
                                    {!isCompliant && result.reason && (
                                        <div style={{ color: '#64748b', marginLeft: '18px', lineHeight: '1.4' }}>
                                            {result.reason}
                                        </div>
                                    )}
                                </div>
                            );
                        } catch (e) {
                            return null;
                        }
                    })()}
                </div>

                {id && (
                    <Space style={{ marginTop: '4px' }}>
                        <Tooltip title="复制内容">
                            <Button
                                type="text"
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={handleCopy}
                                style={{ color: '#94a3b8' }}
                            />
                        </Tooltip>
                        <Tooltip title={isStarred ? "取消收藏" : "收藏消息"}>
                            <Button
                                type="text"
                                size="small"
                                icon={isStarred ? <StarFilled style={{ color: '#f59e0b' }} /> : <StarOutlined />}
                                onClick={handleToggleStar}
                                style={{ color: isStarred ? '#f59e0b' : '#94a3b8' }}
                            />
                        </Tooltip>
                    </Space>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .markdown-content p:last-child { margin-bottom: 0; }
                .markdown-content pre { background: #f1f5f9; padding: 12px; border-radius: 8px; overflow-x: auto; }
                
                .message-bubble {
                    transition: all 0.3s ease;
                }
                
                .message-bubble.user {
                    background: #67aa95ff;
                    color: #fff;
                    border: none;
                }
                
                .message-bubble.assistant {
                    background: #f8fafc;
                    color: #1e293b;
                    border: 1px solid #eef1f4;
                }
                
                :target .message-bubble, .message-bubble.highlight {
                    animation: bubbleHighlight 2.5s ease-out;
                    box-shadow: 0 0 20px rgba(250, 219, 20, 0.6) !important;
                    border-color: #fadb14 !important;
                    z-index: 10;
                }

                @keyframes bubbleHighlight {
                    0% { transform: scale(1); }
                    15% { 
                        transform: scale(1.05); 
                        border-color: #fadb14;
                    }
                    100% { transform: scale(1); }
                }
                /* ... dot-pulse styles ... */

                .dot-pulse {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background-color: #67aa95ff;
                    animation: pulse 1.5s infinite ease-in-out;
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(0.8); opacity: 0.5; }
                    50% { transform: scale(1.2); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default Message;
