import { z } from "zod";

// --- Gear Schema ---
export const SummaryGearSchema = z.object({
    id: z.string().describe("The gear ID"),
    resource_state: z.number().int().describe("The resource state of the gear"),
    primary: z.boolean().describe("The primary of the gear"),
    name: z.string().describe("The name of the gear"),
    distance: z.number().describe("The distance of the gear"), // Distance in meters for the gear
}).nullable().optional(); // Activity might not have gear or it might be null

