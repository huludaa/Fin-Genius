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
    const [mounted, setMounted] = useState(false);

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

    // During SSR and first hydration pass, always render children or a consistent placeholder.
    // To avoid hydration mismatch, we wait until the component is mounted on the client.
    if (!mounted) {
        return <div style={{ visibility: 'hidden' }}>{children}</div>;
    }

    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('token');

    // If we're authenticated or on a public path, show content
    if (user || PUBLIC_PATHS.includes(path)) {
        return <>{children}</>;
    }

    // If we have a token but user info isn't loaded yet, show spinner
    if (hasToken && !user) {
        if (status === 'failed') {
            // If it failed, maybe the token is invalid or server is down.
            // For now, let's just show an error or redirect if not on public path.
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

    // Default to children if no redirect happened yet (e.g., initial flash prevention)
    return <>{children}</>;
};

export default AuthGuard;
