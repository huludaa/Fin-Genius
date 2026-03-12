import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/lib/axios';

interface User {
    id: number;
    username: string;
    is_active: boolean;
    is_superuser: boolean;
}

interface AuthState {
    user: User | null;
    token: string | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
    status: 'idle',
    error: null,
};

export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async (credentials: any, { rejectWithValue }) => { // {rejectWithValue}用于把后端的报错信息（比如“密码太短”）传回给前台
        try {
            const response = await api.post('/auth/token', credentials, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded' // 表单数据提交格式，是浏览器原生表单默认的编码方式。
                }
            });
            localStorage.setItem('token', response.data.access_token);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const registerUser = createAsyncThunk(
    'auth/registerUser',
    async (userData: any, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/register', userData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const fetchUser = createAsyncThunk(
    'auth/fetchUser',
    async (_, { rejectWithValue }) => { // _ 表示不使用第一个参数
        try {
            const response = await api.get('/users/me');
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || { detail: error.message });
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    // 处理同步、简单的内部事务
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            if (typeof window !== 'undefined') localStorage.removeItem('token');
        },
    },
    // 处理上面定义的那些 createAsyncThunk 的异步逻辑
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.token = action.payload.access_token;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.status = 'failed';
                state.error = (action.payload as any)?.detail || '登录失败，请稍后重试';
            })
            .addCase(fetchUser.fulfilled, (state, action) => {
                state.user = action.payload;
                state.status = 'succeeded';
            })
            .addCase(fetchUser.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchUser.rejected, (state, action) => {
                state.status = 'failed';
                state.error = (action.payload as any)?.detail || '授权失败';
                // 如果获取用户信息失败（如 token 过期或服务器宕机），可能需要在此清除 token
                // state.token = null;
                // localStorage.removeItem('token');
            });
    },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
