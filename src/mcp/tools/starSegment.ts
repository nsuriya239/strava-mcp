import { z } from "zod";
import { starSegment as updateStarStatus } from '../../client/stravaClient.js'; // Renamed import

import { createLogger } from '../../utils/logger.js';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

const StarSegmentInputSchema = z.object({
    strava_athlete_id: z.string()
        .describe("The Strava athlete ID for authentication"),
    segmentId: z.number().int().positive().describe("The unique identifier of the segment to star or unstar."),
    starred: z.boolean().describe("Set to true to star the segment, false to unstar it."),
});

type StarSegmentInput = z.infer<typeof StarSegmentInputSchema>;

// Export the tool definition directly
export const starSegment = {
    name: "star-segment",
    description: "Stars or unstars a specific segment for the authenticated athlete.",
    inputSchema: StarSegmentInputSchema,
    execute: async ({ strava_athlete_id, segmentId, starred }: StarSegmentInput) => {
        const token = process.env.STRAVA_ACCESS_TOKEN;

        if (!token || token === 'YOUR_STRAVA_ACCESS_TOKEN_HERE') {
            log.error("Missing or placeholder STRAVA_ACCESS_TOKEN in .env");
            return {
                content: [{ type: "text" as const, text: "❌ Configuration Error: STRAVA_ACCESS_TOKEN is missing or not set in the .env file." }],
                isError: true,
            };
        }

        try {
            const action = starred ? 'starring' : 'unstarring';
            log.info(`Attempting to ${action} segment ID: ${segmentId}...`);

            const updatedSegment = await updateStarStatus(token, segmentId, starred);

            const successMessage = `Successfully ${action} segment: "${updatedSegment.name}" (ID: ${updatedSegment.id}). Its starred status is now: ${updatedSegment.starred}.`;
            log.info(successMessage);

            return { content: [{ type: "text" as const, text: successMessage }] };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
            const action = starred ? 'star' : 'unstar';
            log.error(`Error attempting to ${action} segment ID ${segmentId}:`, errorMessage);
            return {
                content: [{ type: "text" as const, text: `❌ API Error: Failed to ${action} segment ${segmentId}. ${errorMessage}` }],
                isError: true,
            };
        }
    }
};

// Removed old registration function
/*
export function registerStarSegmentTool(server: McpServer) {
    server.tool(
        starSegment.name,
        starSegment.description,
        starSegment.inputSchema.shape,
        starSegment.execute
    );
}
*/ 