import type { AppProps } from 'next/app'; // AppProps里面包含 Component当前页面 和 pageProps页面数据
import { ConfigProvider } from 'antd';
import { Provider } from 'react-redux';
import { store } from '@/store';
import theme from '@/theme/themeConfig';
import AuthGuard from '@/components/auth/AuthGuard';
import '@/styles/globals.css';

import zhCN from 'antd/lib/locale/zh_CN';

// 定义带布局的类型
type ComponentWithPageLayout = AppProps & {
    // Component:  A  &  B，Component = 原来的页面组件 + 额外加一个 getLayout 方法
    Component: AppProps['Component'] & {
        // 参数：ReactElement页面组件，返回值：ReactNode布局组件
        getLayout?: (page: React.ReactElement) => React.ReactNode;
    };
};

export default function App({ Component, pageProps }: ComponentWithPageLayout) {
    const getLayout = Component.getLayout ?? ((page) => page); //？？空值合并。只有在getLayout没定义时（即undefined或者null时），才使用默认的布局page

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
