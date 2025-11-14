import { z } from "zod";

// --- Map Schema ---
export const MapSchema = z.object({
    id: z.string(),
    summary_polyline: z.string().optional().nullable(),
    resource_state: z.number().int(),
}).nullable(); // Activity might not have a map

