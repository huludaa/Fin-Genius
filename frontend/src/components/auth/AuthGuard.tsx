import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchUser } from '@/store/slices/authSlice';
import { Spin } from 'antd';

const PUBLIC_PATHS = ['/login', '/register'];

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user, status, error } = useAppSelector((state) => state.auth);
    const [mounted, setMounted] = useState(false); // 标记组件是否已挂载，是不是已经到了客户端环境

    const path = router.pathname;

    useEffect(() => {
        setMounted(true);
        const storedToken = localStorage.getItem('token');

        if (!storedToken && !PUBLIC_PATHS.includes(path)) {
            router.push('/login');
        } else if (storedToken && !user && status !== 'loading') {
            dispatch(fetchUser());
        }
    }, [path, user, status, router, dispatch]);


    // 组件还没挂载完成时，返回隐藏的容器，避免 hydration 不匹配
    if (!mounted) {
        return <div style={{ visibility: 'hidden' }}>{children}</div>;
    }

    // 检查浏览器中是否存在 token
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('token');

    // 如果已经登录或者当前页面是公共页面，就直接渲染子组件
    if (user || PUBLIC_PATHS.includes(path)) {
        return <>{children}</>;
    }

    // 如果有 token 但用户信息还没加载，就显示加载中
    if (hasToken && !user) {
        if (status === 'failed') {
            // 如果失败了，可能是 token 无效或服务器宕机。
            // 目前，我们只显示错误或重定向到公共路径。
            if (!PUBLIC_PATHS.includes(path)) {
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
                        <h3>Authentication Failed</h3>
                        <p>{typeof error === 'string' ? error : 'Unable to connect to server'}</p>
                        <button onClick={() => { localStorage.removeItem('token'); window.location.reload(); }}>Retry / Login</button>
                    </div>
                );
            }
        }
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
                <Spin size="large" tip="Authenticating...">
                    <div style={{ padding: '50px' }} />
                </Spin>
            </div>
        );
    }

    // 默认渲染子组件，如果没有发生重定向（例如，防止初始闪烁）
    return <>{children}</>;
};

export default AuthGuard;
