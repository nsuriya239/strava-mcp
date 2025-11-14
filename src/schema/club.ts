import { z } from "zod";

// --- Club Schema ---
// Based on https://developers.strava.com/docs/reference/#api-models-SummaryClub
export const SummaryClubSchema = z.object({
    id: z.number().int(),
    resource_state: z.number().int(),
    name: z.string(),
    profile_medium: z.string().url(),
    cover_photo: z.string().url().nullable(),
    cover_photo_small: z.string().url().nullable(),
    sport_type: z.string(), // cycling, running, triathlon, other
    activity_types: z.array(z.string()), // More specific types
    city: z.string(),
    state: z.string(),
    country: z.string(),
    private: z.boolean(),
    member_count: z.number().int(),
    featured: z.boolean(),
    verified: z.boolean(),
    url: z.string().nullable(),
});

export type StravaClubType = z.infer<typeof SummaryClubSchema>;
export const StravaClubsResponseSchema = z.array(SummaryClubSchema);

