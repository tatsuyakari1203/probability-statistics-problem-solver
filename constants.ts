
import type { ModelChoice } from './types';

export const MAX_IMAGE_SIZE_MB = 5;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const GEMINI_MODELS: Record<ModelChoice, { name: string; description: string }> = {
    'gemini-2.5-pro': {
        name: 'Gemini 2.5 Pro',
        description: 'The most capable model, for complex reasoning.',
    },
    'gemini-2.5-flash': {
        name: 'Gemini 2.5 Flash',
        description: 'A lighter-weight and faster model for general tasks.',
    },
    'gemini-2.5-flash-lite': {
        name: 'Gemini 2.5 Flash Lite',
        description: 'The fastest and most compact model for simple tasks.',
    },
};
