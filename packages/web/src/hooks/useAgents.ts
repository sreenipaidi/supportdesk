import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { ENDPOINTS } from '../api/endpoints.js';
import type { User, PaginatedResponse } from '@busybirdies/shared';

export function useAgents() {
  return useQuery<PaginatedResponse<User>>({
    queryKey: ['agents'],
    queryFn: () =>
      api.get<PaginatedResponse<User>>(
        `${ENDPOINTS.users.list}?role=agent&per_page=100`,
      ),
  });
}

export function useClients() {
  return useQuery<PaginatedResponse<User>>({
    queryKey: ['clients'],
    queryFn: () =>
      api.get<PaginatedResponse<User>>(
        `${ENDPOINTS.users.list}?role=client&per_page=100`,
      ),
  });
}

export function useAgentsAndAdmins() {
  return useQuery<PaginatedResponse<User>>({
    queryKey: ['agents-and-admins'],
    queryFn: () =>
      api.get<PaginatedResponse<User>>(
        `${ENDPOINTS.users.list}?per_page=100`,
      ).then((res) => ({
        ...res,
        data: res.data.filter((u) => u.role === 'agent' || u.role === 'admin'),
      })),
  });
}
