// import { McpServer } from "@modelcontextprotocol/sdk/server/mcp"; // Removed
import { z } from "zod";
import {
    getSegmentById as fetchSegmentById,
    // handleApiError, // Removed unused import
} from '../../client/stravaClient.js';
import { StravaDetailedSegmentType } from '../../schema/index.js';

import { createLogger } from '../../utils/logger.js';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

// Input schema
const GetSegmentInputSchema = z.object({
    strava_athlete_id: z.string()
        .describe("The Strava athlete ID for authentication"),
    segmentId: z.number().int().positive().describe("The unique identifier of the segment to fetch.")
});
type GetSegmentInput = z.infer<typeof GetSegmentInputSchema>;

// Helper Functions (Metric Only)
function formatDistance(meters: number | null | undefined): string {
    if (meters === null || meters === undefined) return 'N/A';
    return (meters / 1000).toFixed(2) + ' km';
}

function formatElevation(meters: number | null | undefined): string {
    if (meters === null || meters === undefined) return 'N/A';
    return Math.round(meters) + ' m';
}

// Format segment details (Metric Only)
function formatSegmentDetails(segment: StravaDetailedSegmentType): string {
    const distance = formatDistance(segment.distance);
    const elevationGain = formatElevation(segment.total_elevation_gain);
    const elevationHigh = formatElevation(segment.elevation_high);
    const elevationLow = formatElevation(segment.elevation_low);

    let details = `🗺️ **Segment: ${segment.name}** (ID: ${segment.id})\n`;
    details += `   - Activity Type: ${segment.activity_type}\n`;
    details += `   - Location: ${segment.city || 'N/A'}, ${segment.state || 'N/A'}, ${segment.country || 'N/A'}\n`;
    details += `   - Distance: ${distance}\n`;
    details += `   - Avg Grade: ${segment.average_grade?.toFixed(1) ?? 'N/A'}%, Max Grade: ${segment.maximum_grade?.toFixed(1) ?? 'N/A'}%\n`;
    details += `   - Elevation: Gain ${elevationGain}, High ${elevationHigh}, Low ${elevationLow}\n`;
    details += `   - Climb Category: ${segment.climb_category ?? 'N/A'}\n`;
    details += `   - Private: ${segment.private ? 'Yes' : 'No'}\n`;
    details += `   - Starred by You: ${segment.starred ? 'Yes' : 'No'}\n`; // Assumes starred comes from auth'd user context if present
    details += `   - Total Efforts: ${segment.effort_count}, Athletes: ${segment.athlete_count}\n`;
    details += `   - Star Count: ${segment.star_count}\n`;
    details += `   - Created: ${new Date(segment.created_at).toLocaleDateString()}\n`;
    return details;
}

// Tool definition
export const getSegmentTool = {
    name: "get-segment",
    description: "Fetches detailed information about a specific segment using its ID.",
    inputSchema: GetSegmentInputSchema,
    execute: async ({ strava_athlete_id, segmentId }: GetSegmentInput) => {
        const token = process.env.STRAVA_ACCESS_TOKEN;

        if (!token) {
            log.error("Missing STRAVA_ACCESS_TOKEN environment variable.");
            return {
                content: [{ type: "text" as const, text: "Configuration error: Missing Strava access token." }],
                isError: true
            };
        }

        try {
            log.info(`Fetching details for segment ID: ${segmentId}...`);
            // Removed getAuthenticatedAthlete call
            const segment = await fetchSegmentById(token, segmentId);
            const segmentDetailsText = formatSegmentDetails(segment); // Use metric formatter

            log.info(`Successfully fetched details for segment: ${segment.name}`);
            return { content: [{ type: "text" as const, text: segmentDetailsText }] };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log.error(`Error fetching segment ${segmentId}: ${errorMessage}`);
            // Removed call to handleApiError
            const userFriendlyMessage = errorMessage.includes("Record Not Found") || errorMessage.includes("404")
                ? `Segment with ID ${segmentId} not found.`
                : `An unexpected error occurred while fetching segment details for ID ${segmentId}. Details: ${errorMessage}`;
            return {
                content: [{ type: "text" as const, text: `❌ ${userFriendlyMessage}` }],
                isError: true
            };
        }
    }
};