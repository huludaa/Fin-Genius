import React, { useState, useEffect } from 'react';
import { ReactElement } from 'react';
import { Card, Button, Modal, Space, Tabs, List, Typography, Tooltip, Divider, Table } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, FileTextOutlined } from '@ant-design/icons';
import MainLayout from '@/components/layout/MainLayout';
import PromptForm from '@/components/prompts/PromptForm';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTemplates, deleteTemplate } from '@/store/slices/promptTemplateSlice';
import { fetchUser } from '@/store/slices/authSlice';

const { Title, Text, Paragraph } = Typography;

const Prompts = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('official');
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    const [viewingTemplate, setViewingTemplate] = useState<any>(null);

    const dispatch = useAppDispatch();
    const { templates, status } = useAppSelector((state) => state.promptTemplates);
    const { user } = useAppSelector((state) => state.auth);

    useEffect(() => {
        dispatch(fetchTemplates());
        if (!user) {
            dispatch(fetchUser());
        }
    }, [dispatch, user]);

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: '删除模板',
            content: '您确定要删除这个模板吗？',
            onOk: () => dispatch(deleteTemplate(id)),
        });
    };

    const handleEdit = (record: any) => {
        setEditingTemplate(record);
        setIsModalOpen(true);
    };

    const handleView = (record: any) => {
        setViewingTemplate(record);
        setIsViewModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTemplate(null);
    };

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setViewingTemplate(null);
    };

    const filteredTemplates = templates.filter(t => {
        if (activeTab === 'official') {
            return t.is_official;
        } else {
            return t.owner_id == user?.id; // Show my templates
        }
    });

    const tabItems = [
        { key: 'official', label: '官方库' },
        { key: 'my', label: '我的工作区' },
    ];

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
            <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>提示词模板</Title>
                    <Text type="secondary">管理和配置您的 AI 提示词模板</Text>
                </div>
                {(activeTab === 'my' || user?.is_superuser) && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="large"
                        onClick={() => setIsModalOpen(true)}
                        style={{ borderRadius: '8px', height: '45px', padding: '0 24px' }}
                    >
                        创建新模板
                    </Button>
                )}
            </div>

            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
                size="large"
                style={{ marginBottom: 24 }}
            />

            <Card
                bodyStyle={{ padding: 0 }}
                style={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e2e8f0' }}
            >
                <Table
                    columns={[
                        {
                            title: '模板名称',
                            dataIndex: 'template_name',
                            key: 'template_name',
                            width: 250,
                            render: (text: string) => (
                                <Space>
                                    <Text strong>{text}</Text>
                                </Space>
                            )
                        },
                        {
                            title: '描述',
                            dataIndex: 'description',
                            key: 'description',
                            ellipsis: true
                        },
                        {
                            title: '操作',
                            key: 'action',
                            width: 180,
                            render: (_: any, record: any) => {
                                const isOwner = record.owner_id == user?.id;
                                const isAdmin = user?.is_superuser;
                                const isOfficial = record.is_official;
                                const canModify = isOfficial ? isAdmin : (isOwner || isAdmin);

                                return (
                                    <Space size="middle">
                                        <Tooltip title="查看详情">
                                            <Button type="text" shape="circle" icon={<EyeOutlined />} onClick={() => handleView(record)} />
                                        </Tooltip>
                                        <Tooltip title="编辑模板">
                                            <Button type="text" shape="circle" disabled={!canModify} icon={<EditOutlined style={{ color: canModify ? '#2563EB' : undefined }} />} onClick={() => handleEdit(record)} />
                                        </Tooltip>
                                        <Tooltip title="删除模板">
                                            <Button type="text" shape="circle" danger disabled={!canModify} icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
                                        </Tooltip>
                                    </Space>
                                );
                            },
                        },
                    ]}
                    dataSource={filteredTemplates}
                    rowKey="id"
                    loading={status === 'loading'}
                    pagination={{ pageSize: 10, position: ['bottomRight'] }}
                />
            </Card>

            {/* Creation/Edit Modal */}
            <Modal
                title={null}
                open={isModalOpen}
                onCancel={handleCloseModal}
                footer={null}
                destroyOnClose
                width={800}
                bodyStyle={{ padding: 0 }}
                style={{ top: 20 }}
            >
                <div style={{ padding: '24px 24px 0 24px' }}>
                    <PromptForm
                        initialValues={editingTemplate}
                        onSuccess={() => {
                            handleCloseModal();
                            dispatch(fetchTemplates());
                        }}
                        onCancel={handleCloseModal}
                        isAdmin={user?.is_superuser}
                    />
                </div>
            </Modal>

            {/* View Modal */}
            <Modal
                title={null}
                open={isViewModalOpen}
                onCancel={handleCloseViewModal}
                footer={null}
                destroyOnClose
                width={800}
                bodyStyle={{ padding: 0 }}
                style={{ top: 20 }}
            >
                <div style={{ padding: '24px 24px 0 24px' }}>
                    <PromptForm
                        initialValues={viewingTemplate}
                        readOnly={true}
                        onCancel={handleCloseViewModal}
                        isAdmin={user?.is_superuser}
                    />
                </div>
            </Modal>
        </div>
    );
};

Prompts.getLayout = function getLayout(page: ReactElement) {
    return <MainLayout>{page}</MainLayout>;
};

export default Prompts;
