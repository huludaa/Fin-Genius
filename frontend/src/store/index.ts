import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import chatReducer from './slices/chatSlice';
import promptTemplateReducer from './slices/promptTemplateSlice';
import conversationReducer from './slices/conversationSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        chat: chatReducer,
        promptTemplates: promptTemplateReducer,
        conversations: conversationReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>; // 自动推导出整个 Redux 仓库的状态类型
export type AppDispatch = typeof store.dispatch; // 自动推导出 Redux Dispatch 的类型
