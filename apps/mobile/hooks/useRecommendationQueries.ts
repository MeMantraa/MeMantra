import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryClient';
import {
  recommendationService,
  SuggestionsResponse,
  GetSuggestionsParams,
} from '../services/recommendation.service';

export function useRecommendations(params: GetSuggestionsParams = {}) {
  return useQuery<SuggestionsResponse>({
    queryKey: queryKeys.recommendations.suggestions(params as Record<string, unknown>),
    queryFn: () => recommendationService.getSuggestions(params),
    staleTime: 10 * 60 * 1000, // Recommendations can be stale for 10 min
  });
}
