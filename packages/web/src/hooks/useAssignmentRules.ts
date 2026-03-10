import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { ENDPOINTS } from '../api/endpoints.js';
import type { AssignmentRule } from '@busybirdies/shared';

export function useAssignmentRules() {
  return useQuery<{ data: AssignmentRule[] }>({
    queryKey: ['assignment-rules'],
    queryFn: () => api.get<{ data: AssignmentRule[] }>(ENDPOINTS.assignmentRules.list),
  });
}

export interface CreateRulePayload {
  name: string;
  conditions: { field: string; operator: string; value: string }[];
  action_type: 'assign_agent' | 'assign_group';
  target_agent_id?: string;
  is_active?: boolean;
}

export function useCreateRule() {
  const queryClient = useQueryClient();
  return useMutation<AssignmentRule, Error, CreateRulePayload>({
    mutationFn: (payload) => api.post<AssignmentRule>(ENDPOINTS.assignmentRules.create, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['assignment-rules'] }),
  });
}

export function useUpdateRule(id: string) {
  const queryClient = useQueryClient();
  return useMutation<AssignmentRule, Error, Partial<CreateRulePayload> & { is_active?: boolean }>({
    mutationFn: (payload) => api.patch<AssignmentRule>(ENDPOINTS.assignmentRules.detail(id), payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['assignment-rules'] }),
  });
}

export function useDeleteRule() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => api.delete<void>(ENDPOINTS.assignmentRules.detail(id)),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['assignment-rules'] }),
  });
}

export function useReorderRules() {
  const queryClient = useQueryClient();
  return useMutation<{ data: AssignmentRule[] }, Error, string[]>({
    mutationFn: (rule_ids) => api.put<{ data: AssignmentRule[] }>(ENDPOINTS.assignmentRules.reorder, { rule_ids }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['assignment-rules'] }),
  });
}
