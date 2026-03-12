import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import api from '@/lib/axios';
import { updateMessageStar } from './conversationSlice';

interface Message {
    id?: number;
    role: 'user' | 'assistant' | 'system';
    content: string;
    is_starred?: boolean;
    compliance_result?: string;
    compliance_status?: 'pending' | 'completed' | 'none';
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

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        // 清空消息，新对话或者切换对话时调用
        clearMessages: (state) => {
            state.messages = [];
            state.status = 'idle';
        },
        // 设置等待状态，控制“AI正在思考”的加载动画状态
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.status = action.payload ? 'generating' : 'idle';
        },
        // 添加消息，把用户发出的消息和AI发出的消息都加到消息列表中
        addMessage: (state, action: PayloadAction<Message>) => {
            state.messages.push(action.payload);
        },
        // 流式生成，AI准备说话开启打字机效果
        startStreaming: (state, action: PayloadAction<string | undefined>) => {
            state.status = 'streaming';
            // 添加初始消息
            state.messages.push({
                role: 'assistant',
                content: action.payload || '',
                type: 'text'
            });
        },
        // 追加字符，每吐出一个字符追加到最后一条消息
        appendToLastMessage: (state, action: PayloadAction<string>) => {
            if (state.messages.length > 0) {
                const lastMsg = state.messages[state.messages.length - 1];
                if (lastMsg.role === 'assistant') {
                    lastMsg.content += action.payload;
                    state.status = 'streaming'; // 确保状态为流式生成
                }
            }
        },
        // 更新最后一条消息，用于一次性覆盖最后一条消息的内容（由于流式生成时，最后一条消息的内容可能不完整）
        updateLastMessage: (state, action: PayloadAction<string>) => {
            if (state.messages.length > 0) {
                state.messages[state.messages.length - 1].content = action.payload;
            }
        },
        // AI说完话，关闭打字机效果
        endStreaming: (state) => {
            state.status = 'idle';
        },
        // 更新用户消息的id
        updateUserMessageId: (state, action: PayloadAction<{ content: string; id: number }>) => {
            // 找到最后一个用户消息
            for (let i = state.messages.length - 1; i >= 0; i--) {
                if (state.messages[i].role === 'user' && state.messages[i].content === action.payload.content) {
                    state.messages[i].id = action.payload.id;
                    break;
                }
            }
        },
        // 更新最后一条消息的id
        updateLastMessageId: (state, action: PayloadAction<number>) => {
            if (state.messages.length > 0) {
                state.messages[state.messages.length - 1].id = action.payload;
            }
        },

        // 更新消息的合规性检查状态
        updateComplianceStatus: (state, action: PayloadAction<{ id?: number, status: 'pending' | 'completed' | 'none' }>) => {
            // 如果提供了id，按id查找，否则更新最后一个助手消息
            if (action.payload.id) {
                const msg = state.messages.find(m => m.id === action.payload.id);
                if (msg) msg.compliance_status = action.payload.status;
            } else {
                const lastAssistant = [...state.messages].reverse().find(m => m.role === 'assistant');
                if (lastAssistant) lastAssistant.compliance_status = action.payload.status;
            }
        },
        // 更新消息合规性检查结果
        updateMessageCompliance: (state, action: PayloadAction<{ id?: number, compliance_result: string }>) => {
            // 如果提供了id，按id查找，否则更新最后一个助手消息
            if (action.payload.id) {
                const msg = state.messages.find(m => m.id === action.payload.id);
                if (msg) {
                    msg.compliance_result = action.payload.compliance_result;
                    msg.compliance_status = 'completed';
                }
            } else {
                const lastAssistant = [...state.messages].reverse().find(m => m.role === 'assistant');
                if (lastAssistant) {
                    lastAssistant.compliance_result = action.payload.compliance_result;
                    lastAssistant.compliance_status = 'completed';
                }
            }
        },
    },
    extraReducers: (builder) => {
        // 处理消息星标更新（确保聊天界面消息的星标状态与后端一致）
        builder.addCase(updateMessageStar.fulfilled, (state: any, action: any) => {
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
    updateUserMessageId,
    setLoading,
    clearMessages,
    startStreaming,
    appendToLastMessage,
    endStreaming,
    updateMessageCompliance,
    updateComplianceStatus
} = chatSlice.actions;
export default chatSlice.reducer;
