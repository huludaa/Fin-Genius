import React from 'react';
import { Card, Typography, Row, Col, Space, Button } from 'antd';
import {
    RadarChartOutlined,
    LineChartOutlined,
    BulbOutlined,
    RocketOutlined,
    ArrowRightOutlined,
    FileTextOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/layout/MainLayout';
import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'next/router';

const { Title, Paragraph, Text } = Typography;

const Home = () => {
    const { user } = useAppSelector((state) => state.auth);
    const router = useRouter();

    const features = [
        {
            title: '智能研报分析',
            description: '一键提取核心观点，挖掘潜在机会，让海量信息变得垂手可得。',
            icon: <RadarChartOutlined style={{ fontSize: '24px', color: '#2563EB' }} />,
            bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
        },
        {
            title: '金融产品策略',
            description: '基于大数据分析，为您提供精准的获客策略与金融产品推荐建议。',
            icon: <LineChartOutlined style={{ fontSize: '24px', color: '#7C3AED' }} />,
            bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)'
        },
        {
            title: '自动化内容创作',
            description: '快速生成高质量的营销推文、研报摘要及会议纪要。',
            icon: <BulbOutlined style={{ fontSize: '24px', color: '#059669' }} />,
            bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
        },
        {
            title: '行业核心洞察',
            description: '随时解答您的职场需求，接入实时金融知识库，助您成为领域专家。',
            icon: <RocketOutlined style={{ fontSize: '24px', color: '#DB2777' }} />,
            bg: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)'
        }
    ];

    return (
        <MainLayout>
            <div style={{ padding: '20px 24px', maxWidth: '1200px', margin: '0 auto' }}>
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <Card
                            style={{
                                borderRadius: '24px',
                                border: 'none',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                overflow: 'hidden',
                                position: 'relative'
                            }}
                            bodyStyle={{ padding: '32px 40px', position: 'relative', zIndex: 1 }}
                        >
                            <div className="hero-glow" style={{
                                position: 'absolute',
                                top: '-100px',
                                right: '-100px',
                                width: '400px',
                                height: '400px',
                                background: 'radial-gradient(circle, rgba(205, 250, 227, 0.69) 30%, rgba(205, 250, 227, 0) 70%)',
                                zIndex: 0
                            }} />

                            <Row align="middle" gutter={32} style={{ position: 'relative', zIndex: 1 }}>
                                <Col xs={24} md={16}>
                                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                        <Title style={{ color: '#67aa95bb', margin: 0, fontSize: '32px', fontWeight: 800 }}>
                                            Hi, {user?.username || '用户'} 👋
                                        </Title>
                                        <Title level={4} style={{ color: '#888', margin: 0, fontWeight: 500, border: 'none' }}>
                                            欢迎来到 <span style={{ color: '#67aa95ff', fontWeight: 700 }}>“模”方天地</span>
                                        </Title>
                                        <Paragraph style={{ color: '#888', fontSize: '15px', maxWidth: '600px', marginTop: '4px' }}>
                                            这是您的专属全场景 AI 工作空间。我们集成了先进的大语言模型，专注于为您提供高效的场景定制与智能的任务辅助。
                                        </Paragraph>
                                        <div style={{ marginTop: '12px', display: 'flex', gap: '16px' }}>
                                            <Button
                                                type="primary"
                                                size="large"
                                                className="hero-btn"
                                                icon={<ArrowRightOutlined className="btn-icon" />}
                                                onClick={() => router.push('/chat')}
                                                style={{
                                                    height: '48px',
                                                    padding: '0 24px',
                                                    borderRadius: '12px',
                                                    fontSize: '16px',
                                                    fontWeight: 600,
                                                    background: '#67aa95ff',
                                                    border: 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                                }}
                                            >
                                                立即开启智能对话
                                            </Button>
                                            <Button
                                                size="large"
                                                icon={<FileTextOutlined />}
                                                onClick={() => router.push('/prompts')}
                                                style={{
                                                    height: '48px',
                                                    padding: '0 24px',
                                                    borderRadius: '12px',
                                                    fontSize: '16px',
                                                    fontWeight: 600,
                                                    background: 'rgba(255, 255, 255, 0.5)',
                                                    border: '1px solid #67aa9544',
                                                    color: '#67aa95ee',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                className="secondary-hero-btn"
                                            >
                                                探索提示词模板
                                            </Button>
                                        </div>
                                    </Space>
                                </Col>
                                <Col xs={0} md={8} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    {/* 旋转的立方体 */}
                                    <div className="cube-wrapper">
                                        <div className="cube">
                                            <div className="cube-face front"></div>
                                            <div className="cube-face back"></div>
                                            <div className="cube-face right"></div>
                                            <div className="cube-face left"></div>
                                            <div className="cube-face top"></div>
                                            <div className="cube-face bottom"></div>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </Card>
                    </Col>

                    {/* <Col span={24} style={{ marginTop: '16px' }}>
                        <Title level={4} style={{ marginBottom: '16px', fontWeight: 700, color: '#1e293b' }}>
                            我们能为您做什么？
                        </Title>
                        <Row gutter={[16, 16]}>
                            {[
                                {
                                    title: '多领域场景定制',
                                    description: '无论行政、营销、研发还是文案，秒级生成符合需求的专业内容。',
                                    icon: <RadarChartOutlined style={{ fontSize: '20px', color: '#2563EB' }} />,
                                    bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
                                },
                                {
                                    title: '全场景创意策划',
                                    description: '基于海量知识库，为您提供精准的方案策划、获客引流及产品推广建议。',
                                    icon: <LineChartOutlined style={{ fontSize: '20px', color: '#7C3AED' }} />,
                                    bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)'
                                },
                                {
                                    title: '自动化高效创作',
                                    description: '快速生成高质量的周报摘要、邮件、方案书及各类社交媒体推文。',
                                    icon: <BulbOutlined style={{ fontSize: '20px', color: '#059669' }} />,
                                    bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
                                },
                                {
                                    title: '实时合规助手',
                                    description: '内置全行业合规检查引擎，确保内容合法合规，避免虚假与误导。',
                                    icon: <RocketOutlined style={{ fontSize: '20px', color: '#DB2777' }} />,
                                    bg: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)'
                                }
                            ].map((feature, index) => (
                                <Col xs={24} sm={12} lg={6} key={index}>
                                    <Card
                                        hoverable
                                        style={{
                                            borderRadius: '20px',
                                            border: 'none',
                                            height: '100%',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                        }}
                                        bodyStyle={{ padding: '20px' }}
                                    >
                                        <div style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '12px',
                                            background: feature.bg,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '16px'
                                        }}>
                                            {feature.icon}
                                        </div>
                                        <Title level={5} style={{ marginBottom: '8px', fontWeight: 700 }}>
                                            {feature.title}
                                        </Title>
                                        <Text type="secondary" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                                            {feature.description}
                                        </Text>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Col> */}
                </Row>
            </div>

            <style jsx>{`
                .hero-glow {
                    animation: pulse 8s infinite alternate;
                }
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.5; }
                    100% { transform: scale(1.2); opacity: 0.8; }
                }

                /* 3D Cube Styles */
                .cube-wrapper {
                    width: 120px; 
                    height: 120px;
                    perspective: 600px; /* 透视 */
                }
                .cube {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    transform-style: preserve-3d;
                    animation: rotate 15s infinite linear; /* 15秒一圈，平滑旋转 */
                }
                .cube-face {
                    position: absolute;
                    width: 120px;
                    height: 120px;
                    border: 2px solid #67aa9544;
                    display: flex;
                    align-items: center;
                    justifyContent: center;
                    font-size: 40px;
                    font-weight: 900;
                    color: #67aa95ff;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(8px); /* 给元素背后的所有内容添加模糊效果 */
                    box-shadow: inset 0 0 20px rgba(103, 170, 149, 0.2);
                }
                .front  { transform: translateZ(60px); } /* 沿着 Z 轴向前移动 60 像素 */
                .back   { transform: rotateY(180deg) translateZ(60px); } /* 沿着 Y 轴旋转 180 度，再向前移动 60 像素 */
                .right  { transform: rotateY(90deg) translateZ(60px); } /* 沿着 Y 轴旋转 90 度，再向前移动 60 像素 */
                .left   { transform: rotateY(-90deg) translateZ(60px); } /* 沿着 Y 轴旋转 -90 度，再向前移动 60 像素 */
                .top    { transform: rotateX(90deg) translateZ(60px); } /* 沿着 X 轴旋转 90 度，再向前移动 60 像素 */
                .bottom { transform: rotateX(-90deg) translateZ(60px); } /* 沿着 X 轴旋转 -90 度，再向前移动 60 像素 */

                /* 定位逻辑：创建一个让元素绕 X、Y 双轴同时完整旋转一圈的 3D 动画规则rotate */
                @keyframes rotate {
                    from { transform: rotateX(0deg) rotateY(0deg); }
                    to { transform: rotateX(360deg) rotateY(360deg); }
                }

                :global(.ant-card-hoverable) {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }
                :global(.ant-card-hoverable:hover) {
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
                    transform: translateY(-4px);
                }
                :global(.hero-btn) {
                    box-shadow: 0 4px 14px 0 rgba(103, 170, 149, 0.39) !important;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }
                :global(.hero-btn:hover) {
                    transform: scale(1.05) !important;
                    background: #56917f !important;
                    box-shadow: 0 6px 20px rgba(103, 170, 149, 0.45) !important;
                }
                :global(.hero-btn:hover .btn-icon) {
                    transform: translateX(4px);
                }
                :global(.secondary-hero-btn:hover) {
                    background: #fff !important;
                    border-color: #67aa95ff !important;
                    color: #67aa95ff !important;
                    box-shadow: 0 4px 12px rgba(103, 170, 149, 0.15) !important;
                }
                :global(.btn-icon) {
                    transition: transform 0.3s ease;
                }
            `}</style>
        </MainLayout>
    );
};

export default Home;
