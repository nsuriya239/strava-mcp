import { z } from "zod";
import { BaseAthleteSchema } from "./athlete.js";
import { MapSchema } from "./map.js";
import { SummaryGearSchema } from "./gear.js";

// Define the expected structure of a Strava activity (add more fields as needed)
export const StravaActivitySchema = z.object({
    id: z.number().int().optional().describe("The ID of the activity"), // Include ID for recent activities
    name: z.string().describe("The name of the activity"),
    distance: z.number().describe("The distance of the activity"),
    start_date: z.string().datetime().describe("The start date of the activity"),
    type: z.string().describe("The type of the activity"),
    sport_type: z.string().optional().describe("The sport type of the activity"),
    moving_time: z.number().int().describe("The moving time of the activity"),
    elapsed_time: z.number().int().describe("The elapsed time of the activity"),
    total_elevation_gain: z.number().optional().describe("The total elevation gain of the activity"),
    // Add other relevant fields from the Strava API response if needed
    // e.g., moving_time: z.number(), type: z.string(), ...
});

// Define the expected response structure for the activities endpoint
export const StravaActivitiesResponseSchema = z.array(StravaActivitySchema);

export type StravaActivitiesResponseType = z.infer<typeof StravaActivitiesResponseSchema>;

// --- Detailed Activity Schema ---
// Based on https://developers.strava.com/docs/reference/#api-models-DetailedActivity
export const DetailedActivitySchema = z.object({
    id: z.number().int().describe("The ID of the activity"),
    resource_state: z.number().int().describe("The resource state of the activity"), // Should be 3 for detailed
    athlete: BaseAthleteSchema, // Contains athlete ID
    name: z.string().describe("The name of the activity"),
    distance: z.number().optional().describe("The distance of the activity"), // Optional for stationary activities
    moving_time: z.number().int().optional().describe("The moving time of the activity"),
    elapsed_time: z.number().int().describe("The elapsed time of the activity"),
    total_elevation_gain: z.number().optional().describe("The total elevation gain of the activity"),
    type: z.string().describe("The type of the activity"), // e.g., "Run", "Ride"
    sport_type: z.string().describe("The sport type of the activity"),
    start_date: z.string().datetime().describe("The start date of the activity"),
    start_date_local: z.string().datetime().describe("The start date local of the activity"),
    timezone: z.string().describe("The timezone of the activity"),
    start_latlng: z.array(z.number()).nullable().describe("The start latitude and longitude of the activity"),
    end_latlng: z.array(z.number()).nullable().describe("The end latitude and longitude of the activity"),
    achievement_count: z.number().int().optional().describe("The achievement count of the activity"),
    kudos_count: z.number().int().describe("The kudos count of the activity"),
    comment_count: z.number().int().describe("The comment count of the activity"),
    athlete_count: z.number().int().optional().describe("The athlete count of the activity"), // Number of athletes on the activity
    photo_count: z.number().int().describe("The photo count of the activity"),
    map: MapSchema,
    trainer: z.boolean().describe("The trainer of the activity"),
    commute: z.boolean().describe("The commute of the activity"),
    manual: z.boolean().describe("The manual of the activity"),
    private: z.boolean().describe("The private of the activity"),
    flagged: z.boolean().describe("The flagged of the activity"),
    gear_id: z.string().nullable().describe("The gear ID of the activity"), // ID of the gear used
    average_speed: z.number().optional().describe("The average speed of the activity"),
    max_speed: z.number().optional().describe("The max speed of the activity"),
    average_cadence: z.number().optional().nullable().describe("The average cadence of the activity"),
    average_temp: z.number().int().optional().nullable().describe("The average temp of the activity"),
    average_watts: z.number().optional().nullable().describe("The average watts of the activity"), // Rides only
    max_watts: z.number().int().optional().nullable().describe("The max watts of the activity"), // Rides only
    weighted_average_watts: z.number().int().optional().nullable().describe("The weighted average watts of the activity"), // Rides only
    kilojoules: z.number().optional().nullable().describe("The kilojoules of the activity"), // Rides only
    device_watts: z.boolean().optional().nullable().describe("The device watts of the activity"), // Rides only
    has_heartrate: z.boolean().describe("The has heartrate of the activity"),
    average_heartrate: z.number().optional().nullable().describe("The average heartrate of the activity"),
    max_heartrate: z.number().optional().nullable().describe("The max heartrate of the activity"),
    calories: z.number().optional().describe("The calories of the activity"),
    description: z.string().nullable().describe("The description of the activity"),
    // photos: // Add PhotosSummary schema if needed
    gear: SummaryGearSchema,
    device_name: z.string().optional().nullable().describe("The device name of the activity"),
    // segment_efforts: // Add DetailedSegmentEffort schema if needed
    // splits_metric: // Add Split schema if needed
    // splits_standard: // Add Split schema if needed
    // laps: // Add Lap schema if needed
    // best_efforts: // Add DetailedSegmentEffort schema if needed
});

export type StravaDetailedActivityType = z.infer<typeof DetailedActivitySchema>;

