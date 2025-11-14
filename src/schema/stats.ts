import { z } from "zod";

// --- Stats Schemas ---
// Schema for individual activity totals (like runs, rides, swims)
export const ActivityTotalSchema = z.object({
    count: z.number().int(),
    distance: z.number(), // In meters
    moving_time: z.number().int(), // In seconds
    elapsed_time: z.number().int(), // In seconds
    elevation_gain: z.number(), // In meters
    achievement_count: z.number().int().optional().nullable(), // Optional based on Strava docs examples
});

// Schema for the overall athlete stats response
export const ActivityStatsSchema = z.object({
    biggest_ride_distance: z.number().optional().nullable(),
    biggest_climb_elevation_gain: z.number().optional().nullable(),
    recent_ride_totals: ActivityTotalSchema,
    recent_run_totals: ActivityTotalSchema,
    recent_swim_totals: ActivityTotalSchema,
    ytd_ride_totals: ActivityTotalSchema,
    ytd_run_totals: ActivityTotalSchema,
    ytd_swim_totals: ActivityTotalSchema,
    all_ride_totals: ActivityTotalSchema,
    all_run_totals: ActivityTotalSchema,
    all_swim_totals: ActivityTotalSchema,
});

export type StravaStatsType = z.infer<typeof ActivityStatsSchema>;

