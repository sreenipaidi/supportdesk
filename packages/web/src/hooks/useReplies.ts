import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { ENDPOINTS } from '../api/endpoints.js';
import type {
  TicketReply,
  PaginatedResponse,
} from '@busybirdies/shared';

export function useReplies(ticketId: string) {
  return useQuery<PaginatedResponse<TicketReply>>({
    queryKey: ['replies', ticketId],
    queryFn: () =>
      api.get<PaginatedResponse<TicketReply>>(
        `${ENDPOINTS.tickets.replies(ticketId)}?per_page=50`,
      ),
    enabled: !!ticketId,
  });
}

export interface CreateReplyPayload {
  body: string;
  is_internal: boolean;
}

export function useInvalidateReplies(ticketId: string) {
  const queryClient = useQueryClient();
  return () => {
    // Replies are embedded in the ticket detail response, so invalidate that
    void queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
  };
}

export function useCreateReply(ticketId: string) {
  return useMutation<TicketReply, Error, CreateReplyPayload>({
    mutationFn: (payload) =>
      api.post<TicketReply>(ENDPOINTS.tickets.replies(ticketId), payload),
  });
}
