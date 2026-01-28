import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Modal, Input, message } from 'antd';
import {
    PlusOutlined,
    HistoryOutlined,
    UserOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    StarOutlined,
    StarFilled,
    FileTextOutlined,
    MoreOutlined,
    EditOutlined,
    DeleteOutlined,
    CaretDownOutlined,
    CaretRightOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { fetchConversations, deleteConversation, updateConversation, setCurrentConversationId, clearCurrentMessages } from '@/store/slices/conversationSlice';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [renameValue, setRenameValue] = useState('');
    const [targetConversationId, setTargetConversationId] = useState<number | null>(null);
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);

    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const { conversations } = useAppSelector((state) => state.conversations);

    useEffect(() => {
        dispatch(fetchConversations());
    }, [dispatch]);

    const handleLogout = () => {
        dispatch(logout());
        router.push('/login');
    };

    const handleNewChat = () => {
        dispatch(setCurrentConversationId(null));
        dispatch(clearCurrentMessages());
        router.push('/chat');
    };

    const handleSwitchConversation = (id: number) => {
        dispatch(setCurrentConversationId(id));
        router.push(`/chat?id=${id}`);
    };

    const handleRename = (id: number, currentTitle: string) => {
        setTargetConversationId(id);
        setRenameValue(currentTitle);
        setIsRenameModalOpen(true);
    };

    const submitRename = async () => {
        if (targetConversationId && renameValue.trim()) {
            try {
                await dispatch(updateConversation({ id: targetConversationId, title: renameValue })).unwrap();
                setIsRenameModalOpen(false);
                setTargetConversationId(null);
                message.success('对话重命名成功');
            } catch (err) {
                message.error('重命名失败');
            }
        }
    };

    const toggleStar = async (id: number, currentStarred: boolean) => {
        try {
            await dispatch(updateConversation({ id, is_starred: !currentStarred })).unwrap();
            message.success(!currentStarred ? '已收藏' : '已取消收藏');
        } catch (err) {
            message.error('操作失败');
        }
    };

    const userMenu = (
        <Menu>
            <Menu.Item key="2" icon={<LogoutOutlined />} onClick={handleLogout} danger>
                退出登录
            </Menu.Item>
        </Menu>
    );

    const getItemActions = (conv: any) => (
        <Menu onClick={(e) => e.domEvent.stopPropagation()}>
            <Menu.Item key="star" icon={conv.is_starred ? <StarFilled style={{ color: '#fadb14' }} /> : <StarOutlined />} onClick={() => toggleStar(conv.id, conv.is_starred)}>
                {conv.is_starred ? '取消收藏' : '收藏'}
            </Menu.Item>
            <Menu.Item key="rename" icon={<EditOutlined />} onClick={() => handleRename(conv.id, conv.title)}>
                重命名
            </Menu.Item>
            <Menu.Item key="delete" icon={<DeleteOutlined />} danger onClick={() => {
                Modal.confirm({
                    title: '删除对话',
                    content: '您确定要删除这段对话吗？',
                    onOk: async () => {
                        try {
                            await dispatch(deleteConversation(conv.id)).unwrap();
                            message.success('对话删除成功');
                        } catch (err) {
                            message.error('删除失败');
                        }
                    }
                });
            }}>
                删除
            </Menu.Item>
        </Menu>
    );

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                width={260}
                theme="dark"
                style={{
                    zIndex: 10,
                    position: 'fixed',
                    height: '100vh',
                    left: 0,
                    top: 0
                }}
            >
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 12 }}>
                        <div style={{
                            width: 32, height: 32, backgroundColor: '#2563EB', borderRadius: 8,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                        }}>
                            F
                        </div>
                        {!collapsed && <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>Fin-Genius</span>}
                    </div>

                    {(() => {
                        const isNewChatActive = router.pathname === '/chat' && !router.query.id;

                        return (
                            <Button
                                type={isNewChatActive ? "primary" : "default"}
                                ghost={!isNewChatActive}
                                icon={<PlusOutlined />}
                                block={!collapsed}
                                onClick={handleNewChat}
                                style={{
                                    height: 44,
                                    width: collapsed ? 44 : 'auto',
                                    marginBottom: 20,
                                    backgroundColor: isNewChatActive ? '#2563EB' : 'transparent',
                                    borderColor: isNewChatActive ? '#2563EB' : 'rgba(255,255,255,0.15)',
                                    color: isNewChatActive ? '#fff' : 'rgba(255,255,255,0.65)',
                                    borderRadius: 8,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {!collapsed && '新对话'}
                            </Button>
                        );
                    })()}

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <Menu
                            theme="dark"
                            selectedKeys={[router.asPath]}
                            mode="inline"
                        >
                            <Menu.Item key="/favorites" icon={<StarOutlined />} onClick={() => router.push('/favorites')}>
                                收藏夹
                            </Menu.Item>
                            <Menu.Item key="/prompts" icon={<FileTextOutlined />} onClick={() => router.push('/prompts')}>
                                提示词模板
                            </Menu.Item>
                        </Menu>

                        {!collapsed && (
                            <div style={{ flex: 1, overflowY: 'auto', marginTop: 16, padding: '0 8px' }} className="custom-scrollbar">

                                <div
                                    onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                                    style={{
                                        color: '#888',
                                        paddingLeft: 16,
                                        fontSize: '11px',
                                        textTransform: 'uppercase',
                                        marginBottom: 8,
                                        letterSpacing: '1px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        userSelect: 'none',
                                        marginTop: 16
                                    }}
                                >
                                    {isHistoryExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
                                    对话历史
                                </div>

                                {isHistoryExpanded && (
                                    <Menu theme="dark" mode="inline" selectedKeys={[router.asPath]} style={{ borderRight: 0, background: 'transparent' }}>
                                        {conversations.length > 0 ? (
                                            conversations.map(conv => (
                                                <Menu.Item
                                                    key={`/chat?id=${conv.id}`}
                                                    className="history-menu-item"
                                                    onClick={() => handleSwitchConversation(conv.id)}
                                                    style={{ borderRadius: '8px', marginBottom: '4px' }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', flex: 1, overflow: 'hidden' }}>
                                                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                                {conv.title}
                                                            </span>
                                                        </div>
                                                        <div onClick={(e) => e.stopPropagation()}>
                                                            <Dropdown overlay={getItemActions(conv)} trigger={['click']} placement="bottomRight">
                                                                <MoreOutlined className="history-more-icon" style={{ padding: '4px', cursor: 'pointer' }} />
                                                            </Dropdown>
                                                        </div>
                                                    </div>
                                                </Menu.Item>
                                            ))
                                        ) : (
                                            <div style={{ padding: '16px', color: '#ccc', fontSize: '12px', textAlign: 'center' }}>
                                                暂无历史对话
                                            </div>
                                        )}
                                    </Menu>
                                )}
                            </div>
                        )}
                    </div>

                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ alignSelf: collapsed ? 'center' : 'flex-start', color: '#888' }}
                    />
                </div>
            </Sider>

            <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'all 0.2s', height: '100vh', overflow: 'hidden' }}>
                <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
                    <Dropdown overlay={userMenu} placement="bottomRight">
                        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <span style={{ marginRight: 8 }}>{user?.username}</span>
                            <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#2563EB' }} />
                        </div>
                    </Dropdown>
                </Header>
                <Content style={{ margin: '0', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: '#fafafa' }}>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {children}
                    </div>
                </Content>
            </Layout>

            <Modal
                title="重命名对话"
                open={isRenameModalOpen}
                onOk={submitRename}
                onCancel={() => setIsRenameModalOpen(false)}
                okButtonProps={{ style: { backgroundColor: '#2563EB', borderColor: '#2563EB' } }}
            >
                <Input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    placeholder="请输入新标题"
                    onPressEnter={submitRename}
                />
            </Modal>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #eee;
                    border-radius: 4px;
                }
                .history-menu-item:hover .history-more-icon {
                    opacity: 1 !important;
                }
                .history-more-icon {
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                .ant-menu-item-selected {
                    background-color: #2563EB !important;
                    color: #fff !important;
                }
                .ant-menu-dark .ant-menu-item:hover {
                    color: #fff !important;
                }
            `}</style>
        </Layout>
    );
};

export default MainLayout;
