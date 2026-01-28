import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
    token: {
        fontSize: 16,
        colorPrimary: '#2563EB', // Reverted to professional Blue
        colorLink: '#2563EB',
        borderRadius: 6,
        wireframe: false,
    },
    components: {
        Button: {
            colorPrimary: '#2563EB',
            colorPrimaryHover: '#3B82F6',
        },
        Menu: {
            itemSelectedColor: '#2563EB',
            itemSelectedBg: '#e6f7ff',
        },
        Tabs: {
            itemSelectedColor: '#2563EB',
            inkBarColor: '#2563EB',
            itemHoverColor: '#3B82F6',
        }
    }
};

export default theme;
