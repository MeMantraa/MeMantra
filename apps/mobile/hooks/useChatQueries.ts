import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryClient';
import { chatService } from '../services/chat.service';
import { storage } from '../utils/storage';

async function getToken() {
  return (await storage.getToken()) || '';
}

export function useConversations() {
  return useQuery({
    queryKey: queryKeys.chat.conversations,
    queryFn: async () => {
      const token = await getToken();
      return chatService.getConversations(token);
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { conversationId: number; content: string }) => {
      const token = await getToken();
      return chatService.sendMessage(
        { conversation_id: params.conversationId, content: params.content },
        token,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.messages(variables.conversationId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations });
    },
  });
}
