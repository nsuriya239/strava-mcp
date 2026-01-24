import { z } from "zod";

// --- Map Schema ---
export const MapSchema = z.object({
    id: z.string().describe("The map ID"),
    summary_polyline: z.string().optional().nullable().describe("The summary polyline of the map"),
    resource_state: z.number().int().describe("The resource state of the map"),
}).nullable(); // Activity might not have a map

