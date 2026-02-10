import { z } from 'zod';

// Mood options 
export const moodOptions = [
  'happy',
  'calm',
  'grateful',
  'motivated',
  'anxious',
  'sad',
  'stressed',
  'hopeful',
  'reflective',
  'neutral',
] as const;

// journal entry schema
export const createJournalSchema = z.object({
  body: z.object({
    mantra_id: z.number().int().positive('Invalid mantra ID').optional().nullable(),
    title: z.string().max(255, 'Title must be less than 255 characters').optional(),
    content: z.string().min(1, 'Content is required'),
    mood: z.enum(moodOptions).optional(),
    tags: z.array(z.string().max(50)).max(10, 'Maximum 10 tags allowed').optional(),
    is_private: z.boolean().optional().default(true),
  }),
});

// all fields optional for update
export const updateJournalSchema = z.object({
  body: z.object({
    mantra_id: z.number().int().positive('Invalid mantra ID').optional().nullable(),
    title: z.string().max(255, 'Title must be less than 255 characters').optional(),
    content: z.string().min(1, 'Content is required').optional(),
    mood: z.enum(moodOptions).optional(),
    tags: z.array(z.string().max(50)).max(10, 'Maximum 10 tags allowed').optional(),
    is_private: z.boolean().optional(),
  }),
});

// Journal query schema for pagination and filtering
export const journalQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    mood: z.enum(moodOptions).optional(),
    mantra_id: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
    offset: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  }),
});

// Journal ID param schema
export const journalIdSchema = z.object({
  params: z.object({
    journalId: z.string().transform(Number).pipe(z.number().int().positive('Invalid journal ID')),
  }),
});

// Mantra ID param schema for fetching journals by mantra
export const mantraIdParamSchema = z.object({
  params: z.object({
    mantraId: z.string().transform(Number).pipe(z.number().int().positive('Invalid mantra ID')),
  }),
});

export type CreateJournalInput = z.infer<typeof createJournalSchema>['body'];
export type UpdateJournalInput = z.infer<typeof updateJournalSchema>['body'];
export type JournalQueryInput = z.infer<typeof journalQuerySchema>['query'];
