import { z } from "zod";
import { BaseAthleteSchema } from "./athlete.js";
import { MapSchema } from "./map.js";
import { SummarySegmentSchema } from "./segment.js";

// --- Route Schema ---
// Based on https://developers.strava.com/docs/reference/#api-models-Route
export const RouteSchema = z.object({
    athlete: BaseAthleteSchema, // Reuse BaseAthleteSchema
    description: z.string().nullable(),
    distance: z.number(), // meters
    elevation_gain: z.number().nullable(), // meters
    id: z.number().int(),
    id_str: z.string(),
    map: MapSchema, // Reuse MapSchema
    map_urls: z.object({ // Assuming structure based on context
        retina_url: z.string().url().optional().nullable(),
        url: z.string().url().optional().nullable(),
    }).optional().nullable(),
    name: z.string(),
    private: z.boolean(),
    resource_state: z.number().int(),
    starred: z.boolean(),
    sub_type: z.number().int(), // 1 for "road", 2 for "mtb", 3 for "cx", 4 for "trail", 5 for "mixed"
    type: z.number().int(), // 1 for "ride", 2 for "run"
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
    estimated_moving_time: z.number().int().optional().nullable(), // seconds
    segments: z.array(SummarySegmentSchema).optional().nullable(), // Array of segments within the route
    timestamp: z.number().int().optional().nullable(), // Added based on common patterns
});

export type StravaRouteType = z.infer<typeof RouteSchema>;
export const StravaRoutesResponseSchema = z.array(RouteSchema);

