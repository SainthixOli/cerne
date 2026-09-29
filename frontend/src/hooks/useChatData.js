import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';

export function useChatData(viewMode, selectedChatId) {
    const queryClient = useQueryClient();
    const conversationKey = ['chat', 'conversations', viewMode];

    const conversationsQuery = useQuery({
        queryKey: conversationKey,
        queryFn: async () => {
            const params = viewMode === 'all' ? { mode: 'all' } : {};
            const response = await api.get('/chat/conversations', { params, silent: true });
            return response.data;
        },
        refetchInterval: 10_000
    });

    const messagesQuery = useQuery({
        queryKey: ['chat', 'messages', selectedChatId],
        queryFn: async () => {
            const response = await api.get(`/chat/${selectedChatId}/messages`, { silent: true });
            return response.data;
        },
        enabled: Boolean(selectedChatId),
        refetchInterval: 3_000
    });

    const startConversation = useMutation({
        mutationFn: async (userId) => {
            const response = await api.post('/chat/start', { userId }, { silent: true });
            return response.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
    });

    const sendMessage = useMutation({
        mutationFn: async ({ chatId, content }) => {
            await api.post(`/chat/${chatId}/messages`, { content }, { silent: true });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['chat', 'messages', variables.chatId] });
            queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
        }
    });

    return {
        conversations: conversationsQuery.data || [],
        messages: messagesQuery.data || [],
        refetchConversations: conversationsQuery.refetch,
        startConversation: startConversation.mutateAsync,
        sendMessage: sendMessage.mutateAsync
    };
}
