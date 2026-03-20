import React, { useEffect, useState } from 'react';
import { ReactElement } from 'react';
import { Tabs, List, Card, Typography, Space, Button, Empty, Tag, Modal, message, Spin, Input } from 'antd';
import { StarFilled, StarOutlined, MessageOutlined, ClockCircleOutlined, DeleteOutlined, RobotOutlined, UserOutlined, SearchOutlined } from '@ant-design/icons';
import MainLayout from '@/components/layout/MainLayout';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchConversations, updateConversation, fetchStarredMessages, updateMessageStar } from '@/store/slices/conversationSlice';
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';

const { Title, Text, Paragraph } = Typography;

const Favorites = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { conversations, starredMessages, loading } = useAppSelector((state) => state.conversations);
    const [activeTab, setActiveTab] = useState('conversations');
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        if (conversations.length === 0) {
            dispatch(fetchConversations());
        }
        dispatch(fetchStarredMessages());
    }, [dispatch]);

    const starredConversations = conversations
        .filter(c => c.is_starred)
        .sort((a, b) => new Date(b.starred_at || b.updated_at || b.created_at).getTime() - new Date(a.starred_at || a.updated_at || a.created_at).getTime());

    const filteredConversations = starredConversations.filter(conv =>
        conv.title.toLowerCase().includes(searchText.toLowerCase())
    );

    const sortedStarredMessages = [...starredMessages]
        .sort((a, b) => new Date(b.starred_at || b.created_at).getTime() - new Date(a.starred_at || a.created_at).getTime()); // sort((a, b) => b - a)，“b - a”：代表 降序排列。

    const filteredMessages = sortedStarredMessages.filter(msg => {
        const conv = conversations.find(c => c.id === msg.conversation_id);
        const contentMatch = msg.content.toLowerCase().includes(searchText.toLowerCase());
        const titleMatch = conv?.title.toLowerCase().includes(searchText.toLowerCase()) || false;
        return contentMatch || titleMatch;
    });

    const handleUnstarConversation = (id: number) => {
        dispatch(updateConversation({ id, is_starred: false }));
        message.success('已取消收藏对话');
    };

    const handleUnstarMessage = (id: number) => {
        dispatch(updateMessageStar({ messageId: id, is_starred: false }));
        message.success('已取消收藏消息');
    };

    const goToConversation = (id: number, messageId?: number) => {
        if (messageId) {
            router.push(`/chat?id=${id}#msg-${messageId}`);
        } else {
            router.push(`/chat?id=${id}`);
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
            <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <Title level={2} style={{ marginBottom: 8 }}>我的收藏</Title>
                    <Text type="secondary">管理您收藏的对话和消息</Text>
                </div>
                <Input
                    placeholder="搜索收藏内容..."
                    prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ width: '300px', borderRadius: '8px', height: '40px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                    allowClear
                />
            </div>

            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                    {
                        key: 'conversations',
                        label: (
                            <span>
                                <MessageOutlined /> 收藏对话 ({filteredConversations.length})
                            </span>
                        ),
                    },
                    {
                        key: 'messages',
                        label: (
                            <span>
                                <StarFilled /> 收藏消息 ({filteredMessages.length})
                            </span>
                        ),
                    }
                ]}
            />

            <div style={{ marginTop: 24 }}>
                {loading && <div style={{ textAlign: 'center', padding: '40px' }}><Spin size="large" tip="加载中..." /></div>}

                {!loading && activeTab === 'conversations' ? (
                    filteredConversations.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                            {filteredConversations.map((conv) => (
                                <Card
                                    key={conv.id}
                                    hoverable
                                    onClick={() => goToConversation(conv.id)}
                                    style={{ marginBottom: 16, borderRadius: '12px', border: '1px solid #e2e8f0' }}
                                    styles={{ body: { padding: '20px' } }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Space direction="vertical" size={4} style={{ flex: 1, minWidth: 0 }}>
                                            <Title level={5} style={{ margin: 0, fontSize: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {conv.title}
                                            </Title>
                                            <Space style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                <ClockCircleOutlined />
                                                <span>收藏于 {conv.starred_at ? new Date(conv.starred_at).toLocaleString() : '最近'}</span>
                                            </Space>
                                        </Space>
                                        <Button
                                            type="text"
                                            icon={<StarFilled style={{ color: '#fadb14', fontSize: '18px' }} />}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleUnstarConversation(conv.id);
                                            }}
                                        />
                                    </div>
                                    <div style={{ marginTop: 12 }}>
                                        <Button type="primary" ghost size="small" style={{ borderRadius: '6px' }}>进入对话</Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无收藏对话" />
                    )
                ) : !loading && (
                    filteredMessages.length > 0 ? (
                        <List
                            dataSource={filteredMessages}
                            renderItem={(msg) => {
                                const conv = conversations.find(c => c.id === msg.conversation_id);
                                const snippet = msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content;

                                return (
                                    <Card
                                        key={msg.id}
                                        hoverable
                                        onClick={() => goToConversation(msg.conversation_id, msg.id)}
                                        style={{ marginBottom: 16, borderRadius: '12px', border: '1px solid #e2e8f0' }}
                                        styles={{ body: { padding: '20px' } }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', gap: 12, marginBottom: 8, alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 600, color: '#67aa95ff', fontSize: '14px' }}>
                                                        {conv?.title || '未知对话'}
                                                    </span>
                                                    {msg.role === 'assistant' ? (
                                                        <Tag color="#94a3b8" style={{ border: 'none' }} icon={<RobotOutlined />}>AI 回复</Tag>
                                                    ) : (
                                                        <Tag color="#67aa95ff" style={{ border: 'none' }} icon={<UserOutlined />}>我的提问</Tag>
                                                    )}
                                                </div>
                                                <div style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6' }}>
                                                    {snippet}
                                                </div>
                                                <div style={{ marginTop: 12, fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <ClockCircleOutlined /> 收藏于 {msg.starred_at ? new Date(msg.starred_at).toLocaleString() : new Date(msg.created_at).toLocaleString()}
                                                </div>
                                            </div>
                                            <Space>
                                                <Button
                                                    type="link"
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        goToConversation(msg.conversation_id, msg.id);
                                                    }}
                                                >
                                                    查看
                                                </Button>
                                                <Button
                                                    type="text"
                                                    icon={<StarFilled style={{ color: '#fadb14', fontSize: '18px' }} />}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleUnstarMessage(msg.id);
                                                    }}
                                                />
                                            </Space>
                                        </div>
                                    </Card>
                                );
                            }}
                        />
                    ) : (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无收藏消息" />
                    )
                )}
            </div>

            <style jsx global>{`
                .markdown-content p:last-child { margin-bottom: 0; }
                .markdown-content pre { background: #f8fafc; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 13px; }
            `}</style>
        </div>
    );
};

const Divider = ({ type }: { type: string }) => <span style={{ margin: '0 8px', color: '#eef1f4' }}>|</span>;

Favorites.getLayout = function getLayout(page: ReactElement) {
    return <MainLayout>{page}</MainLayout>;
};

export default Favorites;
