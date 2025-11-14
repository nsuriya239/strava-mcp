import { z } from "zod";
import { MapSchema } from "./map.js";

// --- Segment Schema ---
export const SummarySegmentSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    activity_type: z.string(),
    distance: z.number(),
    average_grade: z.number(),
    maximum_grade: z.number(),
    elevation_high: z.number().optional().nullable(),
    elevation_low: z.number().optional().nullable(),
    start_latlng: z.array(z.number()).optional().nullable(),
    end_latlng: z.array(z.number()).optional().nullable(),
    climb_category: z.number().int().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
    private: z.boolean().optional(),
    starred: z.boolean().optional(),
});

export const DetailedSegmentSchema = SummarySegmentSchema.extend({
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
    total_elevation_gain: z.number().optional().nullable(),
    map: MapSchema, // Now defined above
    effort_count: z.number().int(),
    athlete_count: z.number().int(),
    hazardous: z.boolean(),
    star_count: z.number().int(),
});

export type StravaSegmentType = z.infer<typeof SummarySegmentSchema>;
export type StravaDetailedSegmentType = z.infer<typeof DetailedSegmentSchema>;
export const StravaSegmentsResponseSchema = z.array(SummarySegmentSchema);

