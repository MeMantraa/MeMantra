import { z } from 'zod';

const performanceKind = z.enum([
  'api_request',
  'db_query',
  'mobile_api',
  'mobile_screen',
  'service_operation',
  'scheduler_job',
]);

const performanceStatus = z.enum(['success', 'error']);

const sourceType = z.enum(['backend', 'mobile']).default('mobile');

export const trackPerformanceEventSchema = z.object({
  body: z.object({
    kind: performanceKind,
    name: z.string().trim().min(1).max(120),
    duration_ms: z.number().finite().nonnegative().max(120000),
    status: performanceStatus,
    source: sourceType.optional(),
    route: z.string().trim().min(1).max(200).optional(),
    method: z.string().trim().min(1).max(12).optional(),
    screen: z.string().trim().min(1).max(80).optional(),
    request_id: z.string().trim().min(1).max(80).optional(),
    platform: z.string().trim().min(1).max(50).optional(),
    app_version: z.string().trim().min(1).max(50).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
});
