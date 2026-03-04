import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

interface Template {
    id: number;
    template_name: string;
    description?: string;
    variables?: any[]; // Complex JSON structure
    template_content?: string;
    owner_id: number;
    is_official: boolean;
}

interface PromptTemplateState {
    templates: Template[];
    status: 'idle' | 'loading' | 'failed';
}

const initialState: PromptTemplateState = {
    templates: [],
    status: 'idle',
};

export const fetchTemplates = createAsyncThunk(
    'promptTemplates/fetchTemplates',
    async () => {
        const response = await api.get('/prompt-templates/');
        return response.data;
    }
);

export const createTemplate = createAsyncThunk(
    'promptTemplates/createTemplate',
    async (templateData: any) => {
        const response = await api.post('/prompt-templates/', templateData);
        return response.data;
    }
);

export const updateTemplate = createAsyncThunk(
    'promptTemplates/updateTemplate',
    async ({ id, data }: { id: number; data: any }) => {
        const response = await api.put(`/prompt-templates/${id}`, data);
        return response.data;
    }
);

export const deleteTemplate = createAsyncThunk(
    'promptTemplates/deleteTemplate',
    async (id: number) => {
        await api.delete(`/prompt-templates/${id}`);
        return id;
    }
);

const promptTemplateSlice = createSlice({
    name: 'promptTemplates',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchTemplates.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchTemplates.fulfilled, (state, action) => {
                state.status = 'idle';
                state.templates = action.payload;
            })
            .addCase(fetchTemplates.rejected, (state) => {
                state.status = 'failed';
            })
            .addCase(createTemplate.fulfilled, (state, action) => {
                state.templates.push(action.payload);
            })
            .addCase(updateTemplate.fulfilled, (state, action) => {
                const index = state.templates.findIndex(t => t.id === action.payload.id);
                if (index !== -1) {
                    state.templates[index] = action.payload;
                }
            })
            .addCase(deleteTemplate.fulfilled, (state, action) => {
                state.templates = state.templates.filter(t => t.id !== action.payload);
            });
    },
});

export default promptTemplateSlice.reducer;
