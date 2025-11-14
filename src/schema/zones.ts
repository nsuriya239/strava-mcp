import { z } from "zod";

// --- Zone Schemas ---
export const DistributionBucketSchema = z.object({
    max: z.number(),
    min: z.number(),
    time: z.number().int(), // Time in seconds spent in this bucket
});

export const ZoneSchema = z.object({
    min: z.number(),
    max: z.number().optional(), // Max might be absent for the last zone
});

export const HeartRateZoneSchema = z.object({
    custom_zones: z.boolean(),
    zones: z.array(ZoneSchema),
    distribution_buckets: z.array(DistributionBucketSchema).optional(), // Optional based on sample
    resource_state: z.number().int().optional(), // Optional based on sample
    sensor_based: z.boolean().optional(), // Optional based on sample
    points: z.number().int().optional(), // Optional based on sample
    type: z.literal('heartrate').optional(), // Optional based on sample
});

export const PowerZoneSchema = z.object({
    zones: z.array(ZoneSchema),
    distribution_buckets: z.array(DistributionBucketSchema).optional(), // Optional based on sample
    resource_state: z.number().int().optional(), // Optional based on sample
    sensor_based: z.boolean().optional(), // Optional based on sample
    points: z.number().int().optional(), // Optional based on sample
    type: z.literal('power').optional(), // Optional based on sample
});

// Combined Zones Response Schema
export const AthleteZonesSchema = z.object({
    heart_rate: HeartRateZoneSchema.optional(), // Heart rate zones might not be set
    power: PowerZoneSchema.optional(), // Power zones might not be set
});

export type StravaAthleteZonesType = z.infer<typeof AthleteZonesSchema>;

