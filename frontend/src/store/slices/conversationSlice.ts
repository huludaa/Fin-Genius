import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/lib/axios';

export interface Conversation {
    id: number;
    title: string;
    is_starred: boolean;
    starred_at?: string;
    created_at: string;
    updated_at: string;
}

export interface Message {
    id: number;
    conversation_id: number;
    role: 'user' | 'assistant';
    content: string;
    is_starred: boolean;
    starred_at?: string;
    created_at: string;
}

interface ConversationState {
    conversations: Conversation[];
    currentConversationId: number | null;
    currentMessages: Message[];
    starredMessages: Message[];
    loading: boolean;
    error: string | null;
}

const initialState: ConversationState = {
    conversations: [],
    currentConversationId: null,
    currentMessages: [],
    starredMessages: [],
    loading: false,
    error: null,
};

export const fetchConversations = createAsyncThunk(
    'conversations/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/conversations/');
            return response.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.detail || "获取会话列表失败");
        }
    }
);

export const createNewConversation = createAsyncThunk(
    'conversations/create',
    async (title: string = "New Chat", { rejectWithValue }) => {
        try {
            const response = await api.post('/conversations/', { title });
            return response.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.detail || "创建会话失败");
        }
    }
);

export const updateConversation = createAsyncThunk(
    'conversations/update',
    async ({ id, title, is_starred }: { id: number, title?: string, is_starred?: boolean }, { rejectWithValue }) => {
        try {
            const response = await api.patch(`/conversations/${id}`, { title, is_starred });
            return response.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.detail || "更新会话失败");
        }
    }
);

export const fetchConversationMessages = createAsyncThunk(
    'conversations/fetchMessages',
    async (id: number, { rejectWithValue }) => {
        try {
            const response = await api.get(`/conversations/${id}/messages`);
            return { id, messages: response.data };
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.detail || "获取会话消息失败");
        }
    }
);

export const saveMessage = createAsyncThunk(
    'conversations/saveMessage',
    async ({ id, role, content }: { id: number, role: string, content: string }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/conversations/${id}/messages`, { role, content });
            return response.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.detail || "消息写入数据库失败");
        }
    }
);

export const deleteConversation = createAsyncThunk(
    'conversations/delete',
    async (id: number, { rejectWithValue }) => {
        try {
            await api.delete(`/conversations/${id}`);
            return id;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.detail || "删除会话失败");
        }
    }
);

export const updateMessageStar = createAsyncThunk(
    'conversations/updateMessageStar',
    async ({ messageId, is_starred }: { messageId: number, is_starred: boolean }, { rejectWithValue }) => {
        try {
            const response = await api.patch(`/conversations/messages/${messageId}`, null, { params: { is_starred } });
            return response.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.detail || "更新收藏状态失败");
        }
    }
);

export const fetchStarredMessages = createAsyncThunk(
    'conversations/fetchStarredMessages',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/conversations/starred-messages');
            return response.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.detail || "获取收藏消息失败");
        }
    }
);

const conversationSlice = createSlice({
    name: 'conversations',
    initialState,
    reducers: {
        setCurrentConversationId: (state, action: PayloadAction<number | null>) => {
            state.currentConversationId = action.payload;
        },
        // 清理 “后台”（也就是从数据库里拉回来的历史快照）
        clearCurrentMessages: (state) => {
            state.currentMessages = [];
        },
        resetState: (state) => {
            state.conversations = [];
            state.currentConversationId = null;
            state.currentMessages = [];
            state.starredMessages = [];
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchConversations.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchConversations.fulfilled, (state, action) => {
                state.conversations = action.payload;
                state.loading = false;
            })
            .addCase(fetchConversations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createNewConversation.fulfilled, (state, action) => {
                state.conversations.unshift(action.payload); //unshift:把新元素插到数组的最前面
                state.currentConversationId = action.payload.id;
                state.currentMessages = [];
            })
            .addCase(fetchConversationMessages.fulfilled, (state, action) => {
                state.currentMessages = action.payload.messages;
                state.currentConversationId = action.payload.id;
            })
            .addCase(updateConversation.fulfilled, (state, action) => {
                const index = state.conversations.findIndex(c => c.id === action.payload.id); //findIndex:找到第一个满足条件的元素的索引
                if (index !== -1) { // 找到了。因为索引值最小为0，所以index !== -1等价于找到了
                    state.conversations[index] = action.payload;
                }
            })
            .addCase(saveMessage.fulfilled, (state, action) => {
                // 如果消息属于当前对话，则将其添加到列表中
                if (state.currentConversationId === action.payload.conversation_id) {
                    state.currentMessages.push(action.payload);
                }
                // 如果需要，更新列表中的对话“更新时间”或“标题”
                const conv = state.conversations.find(c => c.id === action.payload.conversation_id);
                if (conv) {
                    conv.updated_at = new Date().toISOString();
                }
            })
            .addCase(deleteConversation.fulfilled, (state, action) => {
                // 把删除的对话从前端历史对话列表中过滤出去
                state.conversations = state.conversations.filter(c => c.id !== action.payload);
                // 如果当前对话是删除的对话，重置当前对话状态
                if (state.currentConversationId === action.payload) {
                    state.currentConversationId = null;
                    state.currentMessages = [];
                }
            })
            .addCase(updateMessageStar.fulfilled, (state, action) => {
                const message = state.currentMessages.find(m => m.id === action.payload.id);
                if (message) {
                    message.is_starred = action.payload.is_starred;
                }
                // 同时更新收藏消息列表
                if (!action.payload.is_starred) {
                    state.starredMessages = state.starredMessages.filter(m => m.id !== action.payload.id);
                } else if (!state.starredMessages.find(m => m.id === action.payload.id)) {
                    state.starredMessages.push(action.payload);
                }
            })
            .addCase(fetchStarredMessages.fulfilled, (state, action) => {
                state.starredMessages = action.payload;
            });
    },
});

export const { setCurrentConversationId, clearCurrentMessages, resetState } = conversationSlice.actions;
export default conversationSlice.reducer;
