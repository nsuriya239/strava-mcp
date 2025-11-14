import { z } from "zod";

// --- Gear Schema ---
export const SummaryGearSchema = z.object({
    id: z.string(),
    resource_state: z.number().int(),
    primary: z.boolean(),
    name: z.string(),
    distance: z.number(), // Distance in meters for the gear
}).nullable().optional(); // Activity might not have gear or it might be null

