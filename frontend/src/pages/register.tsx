import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, RocketOutlined, MailOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import { useAppDispatch } from '@/store/hooks';
import { registerUser } from '@/store/slices/authSlice';
import Link from 'next/link';

const { Title, Text } = Typography;

const Register = () => {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const dispatch = useAppDispatch();

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const resultAction = await dispatch(registerUser(values));
            if (registerUser.fulfilled.match(resultAction)) {
                message.success('注册成功！正在跳转登录页面...');
                setTimeout(() => {
                    router.push('/login');
                }, 1500);
            } else {
                const error: any = resultAction.payload;
                message.error(error?.detail || '注册失败，用户名可能已存在');
            }
        } catch (error) {
            message.error('网络错误，请稍后再试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            padding: '20px'
        }}>
            <Card
                style={{
                    width: '100%',
                    maxWidth: '420px',
                    borderRadius: '24px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                    border: 'none',
                    overflow: 'hidden'
                }}
                bodyStyle={{ padding: '40px' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>创建账号</Title>
                    <Text type="secondary" style={{ fontSize: '15px' }}>填写以下信息以完成注册</Text>
                </div>

                <Form
                    name="register"
                    layout="vertical"
                    onFinish={onFinish}
                    size="large"
                >
                    <Form.Item
                        name="username"
                        rules={[
                            { required: true, message: '请输入用户名' },
                            { min: 3, message: '用户名至少需要3个字符' }
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                            placeholder="用户名"
                            style={{ borderRadius: '12px', height: '50px' }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[
                            { required: true, message: '请输入密码' },
                            { min: 6, message: '密码至少需要6个字符' }
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                            placeholder="密码"
                            style={{ borderRadius: '12px', height: '50px' }}
                        />
                    </Form.Item>

                    <Form.Item style={{ marginTop: '40px' }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            style={{
                                height: '50px',
                                borderRadius: '12px',
                                fontSize: '16px',
                                fontWeight: 600,
                                background: '#67aa95ff',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                            }}
                        >
                            立即注册
                        </Button>
                    </Form.Item>
                </Form>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <Text type="secondary">已经有账号？</Text>
                    <Link href="/login" style={{ marginLeft: '8px', color: '#67aa95ff', fontWeight: 600 }}>
                        登录
                    </Link>
                </div>
            </Card>

            <style>{`
                .ant-btn-primary:hover {
                    background: #508172ff !important;
                    transform: translateY(-1px);
                    transition: all 0.2s;
                }
                .ant-input:focus, .ant-input-focused {
                    border-color: #67aa95ff !important;
                    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1) !important;
                }
            `}</style>
        </div>
    );
};

export default Register;
