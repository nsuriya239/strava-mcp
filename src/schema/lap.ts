// --- Lap Schema ---

import { z } from "zod";
import { BaseAthleteSchema } from "./athlete.js";

// Based on https://developers.strava.com/docs/reference/#api-models-Lap and user-provided image
const LapSchema = z.object({
    id: z.number().int(),
    resource_state: z.number().int(),
    name: z.string(),
    activity: BaseAthleteSchema, // Reusing BaseAthleteSchema for {id, resource_state}
    athlete: BaseAthleteSchema, // Reusing BaseAthleteSchema for {id, resource_state}
    elapsed_time: z.number().int(), // In seconds
    moving_time: z.number().int(), // In seconds
    start_date: z.string().datetime(),
    start_date_local: z.string().datetime(),
    distance: z.number(), // In meters
    start_index: z.number().int().optional().nullable(), // Index in the activity stream
    end_index: z.number().int().optional().nullable(), // Index in the activity stream
    total_elevation_gain: z.number().optional().nullable(), // In meters
    average_speed: z.number().optional().nullable(), // In meters per second
    max_speed: z.number().optional().nullable(), // In meters per second
    average_cadence: z.number().optional().nullable(), // RPM
    average_watts: z.number().optional().nullable(), // Rides only
    device_watts: z.boolean().optional().nullable(), // Whether power sensor was used
    average_heartrate: z.number().optional().nullable(), // Average heart rate during lap
    max_heartrate: z.number().optional().nullable(), // Max heart rate during lap
    lap_index: z.number().int(), // The position of this lap in the activity
    split: z.number().int().optional().nullable(), // Associated split number (e.g., for marathons)
});

export type StravaLapType = z.infer<typeof LapSchema>;
export const StravaLapsResponseSchema = z.array(LapSchema);    
