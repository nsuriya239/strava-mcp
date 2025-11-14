import { z } from "zod";
import { BaseAthleteSchema } from "./athlete.js";
import { MetaActivitySchema } from "./meta.js";
import { SummarySegmentSchema } from "./segment.js";

// --- Segment Effort Schema ---
// Based on https://developers.strava.com/docs/reference/#api-models-DetailedSegmentEffort
export const DetailedSegmentEffortSchema = z.object({
    id: z.number().int(),
    activity: MetaActivitySchema,
    athlete: BaseAthleteSchema,
    segment: SummarySegmentSchema, // Reuse SummarySegmentSchema
    name: z.string(), // Segment name
    elapsed_time: z.number().int(), // seconds
    moving_time: z.number().int(), // seconds
    start_date: z.string().datetime(),
    start_date_local: z.string().datetime(),
    distance: z.number(), // meters
    start_index: z.number().int().optional().nullable(),
    end_index: z.number().int().optional().nullable(),
    average_cadence: z.number().optional().nullable(),
    device_watts: z.boolean().optional().nullable(),
    average_watts: z.number().optional().nullable(),
    average_heartrate: z.number().optional().nullable(),
    max_heartrate: z.number().optional().nullable(),
    kom_rank: z.number().int().optional().nullable(), // 1-10, null if not in top 10
    pr_rank: z.number().int().optional().nullable(), // 1, 2, 3, or null
    hidden: z.boolean().optional().nullable(),
});

export type StravaDetailedSegmentEffortType = z.infer<typeof DetailedSegmentEffortSchema>;

