import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryClient';
import { ratingService, RatingResponse, AverageRatingResponse } from '../services/rating.service';
import { storage } from '../utils/storage';

async function getToken() {
  return (await storage.getToken()) || '';
}

export function useUserRating(mantraId: number) {
  return useQuery<RatingResponse>({
    queryKey: queryKeys.ratings.forMantra(mantraId),
    queryFn: async () => {
      const token = await getToken();
      return ratingService.getUserRating(mantraId, token);
    },
    enabled: !!mantraId,
  });
}

export function useAverageRating(mantraId: number) {
  return useQuery<AverageRatingResponse>({
    queryKey: queryKeys.ratings.average(mantraId),
    queryFn: () => ratingService.getAverageRating(mantraId),
    enabled: !!mantraId,
  });
}

export function useRateMantra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { mantraId: number; rating: number; reviewText?: string }) => {
      const token = await getToken();
      return ratingService.rateMantra(params.mantraId, params.rating, params.reviewText, token);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.ratings.forMantra(variables.mantraId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.ratings.average(variables.mantraId),
      });
    },
  });
}
