import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/lib/axios';

export interface Conversation {
    id: number;
    title: string;
    is_starred: boolean;
    created_at: string;
    updated_at: string;
}

export interface Message {
    id: number;
    conversation_id: number;
    role: 'user' | 'assistant';
    content: string;
    is_starred: boolean;
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
            return rejectWithValue(err.response?.data?.detail || "Failed to fetch conversations");
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
            return rejectWithValue(err.response?.data?.detail || "Failed to create conversation");
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
            return rejectWithValue(err.response?.data?.detail || "Failed to update conversation");
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
            return rejectWithValue(err.response?.data?.detail || "Failed to fetch messages");
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
            return rejectWithValue(err.response?.data?.detail || "Failed to save message");
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
            return rejectWithValue(err.response?.data?.detail || "Failed to delete conversation");
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
            return rejectWithValue(err.response?.data?.detail || "Failed to update message star status");
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
            return rejectWithValue(err.response?.data?.detail || "Failed to fetch starred messages");
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
        clearCurrentMessages: (state) => {
            state.currentMessages = [];
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
                state.conversations.unshift(action.payload);
                state.currentConversationId = action.payload.id;
                state.currentMessages = [];
            })
            .addCase(fetchConversationMessages.fulfilled, (state, action) => {
                state.currentMessages = action.payload.messages;
                state.currentConversationId = action.payload.id;
            })
            .addCase(updateConversation.fulfilled, (state, action) => {
                const index = state.conversations.findIndex(c => c.id === action.payload.id);
                if (index !== -1) {
                    state.conversations[index] = action.payload;
                }
            })
            .addCase(saveMessage.fulfilled, (state, action) => {
                // If the message belongs to current conversation, add it
                if (state.currentConversationId === action.payload.conversation_id) {
                    state.currentMessages.push(action.payload);
                }
                // Update conversation's updated_at or title in the list if needed
                const conv = state.conversations.find(c => c.id === action.payload.conversation_id);
                if (conv) {
                    conv.updated_at = new Date().toISOString();
                    // If first message, backend already updated title, but we might want to refresh list
                }
            })
            .addCase(deleteConversation.fulfilled, (state, action) => {
                state.conversations = state.conversations.filter(c => c.id !== action.payload);
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
                // Also update in starredMessages list
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

export const { setCurrentConversationId, clearCurrentMessages } = conversationSlice.actions;
export default conversationSlice.reducer;
