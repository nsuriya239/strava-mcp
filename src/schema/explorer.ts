import { z } from "zod";

// --- Explorer Schemas ---
// Based on https://developers.strava.com/docs/reference/#api-models-ExplorerSegment
export const ExplorerSegmentSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    climb_category: z.number().int(),
    climb_category_desc: z.string(), // e.g., "NC", "4", "3", "2", "1", "HC"
    avg_grade: z.number(),
    start_latlng: z.array(z.number()),
    end_latlng: z.array(z.number()),
    elev_difference: z.number(),
    distance: z.number(), // meters
    points: z.string(), // Encoded polyline
    starred: z.boolean().optional(), // Only included if authenticated
});

// Based on https://developers.strava.com/docs/reference/#api-models-ExplorerResponse
export const ExplorerResponseSchema = z.object({
    segments: z.array(ExplorerSegmentSchema),
});

export type StravaExplorerSegmentType = z.infer<typeof ExplorerSegmentSchema>;
export type StravaExplorerResponseType = z.infer<typeof ExplorerResponseSchema>;

