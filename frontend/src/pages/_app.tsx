import type { AppProps } from 'next/app';
import { ConfigProvider } from 'antd';
import { Provider } from 'react-redux';
import { store } from '@/store';
import theme from '@/theme/themeConfig';
import AuthGuard from '@/components/auth/AuthGuard';
import '@/styles/globals.css';

import zhCN from 'antd/lib/locale/zh_CN';

// Type for page with layout
type ComponentWithPageLayout = AppProps & {
    Component: AppProps['Component'] & {
        getLayout?: (page: React.ReactElement) => React.ReactNode;
    };
};

export default function App({ Component, pageProps }: ComponentWithPageLayout) {
    const getLayout = Component.getLayout ?? ((page) => page);

    return (
        <Provider store={store}>
            <ConfigProvider theme={theme} locale={zhCN}>
                <AuthGuard>
                    {getLayout(<Component {...pageProps} />)}
                </AuthGuard>
            </ConfigProvider>
        </Provider>
    );
}
