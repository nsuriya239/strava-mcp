import { z } from "zod";

// --- Meta Schemas ---
// Based on https://developers.strava.com/docs/reference/#api-models-MetaActivity
export const MetaActivitySchema = z.object({
    id: z.number().int(),
});

// BaseAthleteSchema serves as MetaAthleteSchema (id only needed for effort)

