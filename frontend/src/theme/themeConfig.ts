import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
    token: {
        fontSize: 16,
        colorPrimary: '#67aa95ff',
        colorLink: '#67aa95ff',
        borderRadius: 6,
        wireframe: false,
    },
    components: {
        Button: {
            colorPrimary: '#67aa95ff',
            colorPrimaryHover: '#67aa95bb',
        },
        Menu: {
            itemSelectedColor: '#67aa95ff',
            itemSelectedBg: '#e6f7ff',
        },
        Tabs: {
            itemSelectedColor: '#67aa95ff',
            inkBarColor: '#67aa95ff',
            itemHoverColor: '#67aa95bb',
        }
    }
};

export default theme;
