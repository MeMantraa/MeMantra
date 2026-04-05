import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (garbage collection)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Query key factory for consistent cache keys
export const queryKeys = {
  mantras: {
    all: ['mantras'] as const,
    feed: ['mantras', 'feed'] as const,
    detail: (id: number) => ['mantras', id] as const,
    liked: ['mantras', 'liked'] as const,
    saved: ['mantras', 'saved'] as const,
  },
  categories: {
    all: ['categories'] as const,
    detail: (id: number) => ['categories', id] as const,
    byType: (type: string) => ['categories', 'type', type] as const,
    forMantra: (mantraId: number) => ['categories', 'mantra', mantraId] as const,
  },
  collections: {
    all: ['collections'] as const,
    detail: (id: number) => ['collections', id] as const,
  },
  journal: {
    all: ['journal'] as const,
    detail: (id: number) => ['journal', id] as const,
    byMantra: (mantraId: number) => ['journal', 'mantra', mantraId] as const,
    stats: ['journal', 'stats'] as const,
  },
  reminders: {
    all: ['reminders'] as const,
    active: ['reminders', 'active'] as const,
    detail: (id: number) => ['reminders', id] as const,
  },
  recommendations: {
    suggestions: (params?: Record<string, unknown>) =>
      ['recommendations', 'suggestions', params] as const,
  },
  ratings: {
    forMantra: (mantraId: number) => ['ratings', 'mantra', mantraId] as const,
    average: (mantraId: number) => ['ratings', 'average', mantraId] as const,
  },
  algorithm: {
    scores: ['algorithm', 'scores'] as const,
    topCategories: (limit: number) => ['algorithm', 'top', limit] as const,
  },
  chat: {
    conversations: ['chat', 'conversations'] as const,
    messages: (conversationId: number) => ['chat', 'messages', conversationId] as const,
  },
  users: {
    all: ['users'] as const,
    detail: (id: number) => ['users', id] as const,
  },
} as const;
