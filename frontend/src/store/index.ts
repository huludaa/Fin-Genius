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

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
