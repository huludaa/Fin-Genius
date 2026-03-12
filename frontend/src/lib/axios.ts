import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api', // 设置后端地址
    headers: {
        'Content-Type': 'application/json',
    },
});

// 请求拦截器
api.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null; //  typeof window !== 'undefined'：判断「当前代码是否运行在浏览器环境」
    if (token) {
        config.headers.Authorization = `Bearer ${token}`; // Bearer 是一种常见的认证方案，表示使用令牌（Token）进行身份验证
    }
    return config;
});

// 响应拦截器
api.interceptors.response.use(
    (response) => response, // 成功响应
    (error) => {
        if (error.response && [401, 403].includes(error.response.status)) { // 401 未授权 403 禁止访问
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token'); // 删除 token
                // 如果当前页面不是登录页面，则跳转到登录页面
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
