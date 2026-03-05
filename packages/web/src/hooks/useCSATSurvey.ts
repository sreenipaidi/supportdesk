import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client.js';
import { ENDPOINTS } from '../api/endpoints.js';

/** Survey metadata returned from the public survey endpoint. */
export interface SurveyData {
  ticket_number: string;
  subject: string;
  agent_name: string;
  tenant_name: string;
  logo_url: string | null;
  brand_color: string;
  already_submitted: boolean;
}

/** Payload for submitting a CSAT survey response. */
export interface SubmitCSATPayload {
  rating: number;
  comment?: string;
}

/** Response from submitting a survey. */
export interface SubmitCSATResponse {
  message: string;
}

/**
 * TanStack Query hook to fetch survey data by token.
 * This is a public endpoint -- no auth needed.
 */
export function useCSATSurvey(token: string) {
  return useQuery<SurveyData>({
    queryKey: ['csat', 'survey', token],
    queryFn: () =>
      apiClient<SurveyData>(`${ENDPOINTS.csat.get(token)}`, { method: 'GET' }),
    enabled: !!token,
    retry: false,
  });
}

/**
 * TanStack Query mutation hook to submit a CSAT survey response.
 */
export function useSubmitCSAT(token: string) {
  return useMutation<SubmitCSATResponse, Error, SubmitCSATPayload>({
    mutationFn: (payload) =>
      apiClient<SubmitCSATResponse>(`${ENDPOINTS.csat.submit(token)}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  });
}
