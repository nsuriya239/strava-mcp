import { z } from "zod";

// Define the expected structure for the Authenticated Athlete response
export const BaseAthleteSchema = z.object({
    id: z.number().int(),
    resource_state: z.number().int(),
});

export const DetailedAthleteSchema = BaseAthleteSchema.extend({
    username: z.string().nullable(),
    firstname: z.string(),
    lastname: z.string(),
    country: z.string().nullable(),
    sex: z.enum(["M", "F"]).nullable(),
    created_at: z.string().datetime(),
    profile_medium: z.string().url(),
    profile: z.string().url(),
    weight: z.number().nullable(),
    measurement_preference: z.enum(["feet", "meters"]).optional().nullable(),
    // Add other fields as needed (e.g., follower_count, friend_count, ftp, clubs, bikes, shoes)
});

// Type alias for the inferred athlete type
export type StravaAthleteType = z.infer<typeof DetailedAthleteSchema>;

