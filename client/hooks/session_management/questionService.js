import { API_ROUTES } from '@/config';
import apiClient from '@/utils/axiosinterceptor';

export const saveSessionQuestions = async (mcqQuestions, sessionId) => {
    const response = await apiClient.post(
        API_ROUTES.SESSION_SERVICE.SAVE_MCQ,
        {
            mcqArray: mcqQuestions,
            sessionId,
        },
        {
            headers: { 'Content-Type': 'application/json' },
        }
    );
    return response.data;
};
