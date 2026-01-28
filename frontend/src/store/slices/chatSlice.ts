import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/lib/axios';

interface Message {
    id?: number;
    role: 'user' | 'assistant' | 'system';
    content: string;
    is_starred?: boolean;
    compliance_result?: string;
    type?: 'text' | 'error' | 'loading';
}

interface ChatState {
    messages: Message[];
    status: 'idle' | 'generating' | 'streaming' | 'failed';
}

const initialState: ChatState = {
    messages: [],
    status: 'idle',
};

// Start generation (initial request)
export const sendMessage = createAsyncThunk(
    'chat/sendMessage',
    async ({ prompt, history }: { prompt: string; history: Message[] }, { dispatch, rejectWithValue }) => {
        try {
            // Filter history to only valid chat messages
            const validHistory = history.filter(m => m.type === 'text' && (m.role === 'user' || m.role === 'assistant'));

            // Clean history payload
            const payloadHistory = validHistory.map(m => ({ role: m.role, content: m.content }));

            const response = await api.post('/ai/generate-content', { prompt, history: payloadHistory }, { responseType: 'text' });
            return response.data;
        } catch (err: any) {
            console.error("Chat API Error:", err);
            // Better error extraction
            const errorMessage = err.response?.data?.detail || err.message || "Unknown error";
            return rejectWithValue(errorMessage);
        }
    }
);

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        addMessage: (state, action: PayloadAction<Message>) => {
            state.messages.push(action.payload);
        },
        updateLastMessage: (state, action: PayloadAction<string>) => {
            if (state.messages.length > 0) {
                state.messages[state.messages.length - 1].content = action.payload;
            }
        },
        // Streaming actions
        startStreaming: (state, action: PayloadAction<string | undefined>) => {
            state.status = 'streaming';
            // Add initial message with chunk if provided
            state.messages.push({
                role: 'assistant',
                content: action.payload || '',
                type: 'text'
            });
        },
        appendToLastMessage: (state, action: PayloadAction<string>) => {
            if (state.messages.length > 0) {
                const lastMsg = state.messages[state.messages.length - 1];
                if (lastMsg.role === 'assistant') {
                    lastMsg.content += action.payload;
                    state.status = 'streaming'; // Ensure status is streaming if we get chunks
                }
            }
        },
        updateLastMessageId: (state, action: PayloadAction<number>) => {
            if (state.messages.length > 0) {
                state.messages[state.messages.length - 1].id = action.payload;
            }
        },
        updateMessageStarStatus: (state, action: PayloadAction<{ id: number, is_starred: boolean }>) => {
            const msg = state.messages.find(m => m.id === action.payload.id);
            if (msg) {
                msg.is_starred = action.payload.is_starred;
            }
        },
        endStreaming: (state) => {
            state.status = 'idle';
        },
        updateMessageCompliance: (state, action: PayloadAction<{ id?: number, compliance_result: string }>) => {
            // If id is provided, find by id, otherwise update last assistant message
            if (action.payload.id) {
                const msg = state.messages.find(m => m.id === action.payload.id);
                if (msg) msg.compliance_result = action.payload.compliance_result;
            } else {
                const lastAssistant = [...state.messages].reverse().find(m => m.role === 'assistant');
                if (lastAssistant) lastAssistant.compliance_result = action.payload.compliance_result;
            }
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.status = action.payload ? 'generating' : 'idle';
        },
        clearMessages: (state) => {
            state.messages = [];
            state.status = 'idle';
        }
    },
    extraReducers: (builder) => {
        // Handle message star update from conversationSlice
        builder.addCase('conversations/updateMessageStar/fulfilled', (state: any, action: any) => {
            const msg = state.messages.find((m: any) => m.id === action.payload.id);
            if (msg) {
                msg.is_starred = action.payload.is_starred;
            }
        });
    },
});

export const {
    addMessage,
    updateLastMessage,
    updateLastMessageId,
    updateMessageStarStatus,
    setLoading,
    clearMessages,
    startStreaming,
    appendToLastMessage,
    endStreaming,
    updateMessageCompliance
} = chatSlice.actions;
export default chatSlice.reducer;
