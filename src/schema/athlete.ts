import { z } from "zod";

// Define the expected structure for the Authenticated Athlete response
export const BaseAthleteSchema = z.object({
    id: z.number().int().describe("The athlete ID"),
    resource_state: z.number().int().describe("The resource state"),
});

export const DetailedAthleteSchema = BaseAthleteSchema.extend({
    username: z.string().nullable().describe("The athlete username"),
    firstname: z.string().describe("The athlete firstname"),
    lastname: z.string().describe("The athlete lastname"),
    country: z.string().nullable().describe("The athlete country"),
    sex: z.enum(["M", "F"]).nullable().describe("The athlete sex"),
    created_at: z.string().datetime().describe("The athlete created at"),
    profile_medium: z.string().url().describe("The athlete profile medium"),
    profile: z.string().url().describe("The athlete profile"),
    weight: z.number().nullable().describe("The athlete weight"),
    measurement_preference: z.enum(["feet", "meters"]).optional().nullable().describe("The athlete measurement preference"),
    // Add other fields as needed (e.g., follower_count, friend_count, ftp, clubs, bikes, shoes)
});

// Type alias for the inferred athlete type
export type StravaAthleteType = z.infer<typeof DetailedAthleteSchema>;

