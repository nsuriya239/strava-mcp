import { z } from "zod";
import { BaseAthleteSchema } from "./athlete.js";
import { MapSchema } from "./map.js";
import { SummaryGearSchema } from "./gear.js";

// Define the expected structure of a Strava activity (add more fields as needed)
export const StravaActivitySchema = z.object({
    id: z.number().int().optional(), // Include ID for recent activities
    name: z.string(),
    distance: z.number(),
    start_date: z.string().datetime(),
    type: z.string(),
    sport_type: z.string().optional(),
    moving_time: z.number().int(),
    elapsed_time: z.number().int(),
    total_elevation_gain: z.number().optional(),    
    // Add other relevant fields from the Strava API response if needed
    // e.g., moving_time: z.number(), type: z.string(), ...
});

// Define the expected response structure for the activities endpoint
export const StravaActivitiesResponseSchema = z.array(StravaActivitySchema);

// --- Detailed Activity Schema ---
// Based on https://developers.strava.com/docs/reference/#api-models-DetailedActivity
export const DetailedActivitySchema = z.object({
    id: z.number().int(),
    resource_state: z.number().int(), // Should be 3 for detailed
    athlete: BaseAthleteSchema, // Contains athlete ID
    name: z.string(),
    distance: z.number().optional(), // Optional for stationary activities
    moving_time: z.number().int().optional(),
    elapsed_time: z.number().int(),
    total_elevation_gain: z.number().optional(),
    type: z.string(), // e.g., "Run", "Ride"
    sport_type: z.string(),
    start_date: z.string().datetime(),
    start_date_local: z.string().datetime(),
    timezone: z.string(),
    start_latlng: z.array(z.number()).nullable(),
    end_latlng: z.array(z.number()).nullable(),
    achievement_count: z.number().int().optional(),
    kudos_count: z.number().int(),
    comment_count: z.number().int(),
    athlete_count: z.number().int().optional(), // Number of athletes on the activity
    photo_count: z.number().int(),
    map: MapSchema,
    trainer: z.boolean(),
    commute: z.boolean(),
    manual: z.boolean(),
    private: z.boolean(),
    flagged: z.boolean(),
    gear_id: z.string().nullable(), // ID of the gear used
    average_speed: z.number().optional(),
    max_speed: z.number().optional(),
    average_cadence: z.number().optional().nullable(),
    average_temp: z.number().int().optional().nullable(),
    average_watts: z.number().optional().nullable(), // Rides only
    max_watts: z.number().int().optional().nullable(), // Rides only
    weighted_average_watts: z.number().int().optional().nullable(), // Rides only
    kilojoules: z.number().optional().nullable(), // Rides only
    device_watts: z.boolean().optional().nullable(), // Rides only
    has_heartrate: z.boolean(),
    average_heartrate: z.number().optional().nullable(),
    max_heartrate: z.number().optional().nullable(),
    calories: z.number().optional(),
    description: z.string().nullable(),
    // photos: // Add PhotosSummary schema if needed
    gear: SummaryGearSchema,
    device_name: z.string().optional().nullable(),
    // segment_efforts: // Add DetailedSegmentEffort schema if needed
    // splits_metric: // Add Split schema if needed
    // splits_standard: // Add Split schema if needed
    // laps: // Add Lap schema if needed
    // best_efforts: // Add DetailedSegmentEffort schema if needed
});

export type StravaDetailedActivityType = z.infer<typeof DetailedActivitySchema>;

