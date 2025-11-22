import { z } from "zod";
import { fileURLToPath } from "url";
import { getAuthenticatedAthlete, listStarredSegments as fetchSegments } from '../../client/stravaClient.js'; // Renamed import
import { createLogger } from '../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

const ListStarredSegmentsInputSchema = z.object({
    strava_athlete_id: z.string()
        .describe("The Strava athlete ID for authentication"),
});

type ListStarredSegmentsInput = z.infer<typeof ListStarredSegmentsInputSchema>;

// Export the tool definition directly
export const listStarredSegments = {
    name: "list-starred-segments",
    description: "Lists the segments starred by the authenticated athlete.",
    inputSchema: ListStarredSegmentsInputSchema,
    execute: async ({ strava_athlete_id }: ListStarredSegmentsInput) => {
        const token = process.env.STRAVA_ACCESS_TOKEN;

        if (!token || token === 'YOUR_STRAVA_ACCESS_TOKEN_HERE') {
            log.error("Missing or placeholder STRAVA_ACCESS_TOKEN in .env");
            return {
                content: [{ type: "text" as const, text: "❌ Configuration Error: STRAVA_ACCESS_TOKEN is missing or not set in the .env file." }],
                isError: true,
            };
        }

        try {
            log.error("Fetching starred segments...");
            // Need athlete measurement preference for formatting distance
            const athlete = await getAuthenticatedAthlete(token);
            // Use renamed import
            const segments = await fetchSegments(token);
            log.error(`Successfully fetched ${segments?.length ?? 0} starred segments.`);

            if (!segments || segments.length === 0) {
                return { content: [{ type: "text" as const, text: " MNo starred segments found." }] };
            }

            const distanceFactor = athlete.measurement_preference === 'feet' ? 0.000621371 : 0.001;
            const distanceUnit = athlete.measurement_preference === 'feet' ? 'mi' : 'km';

            // Format the segments into a text response
            const segmentText = segments.map(segment => {
                const location = [segment.city, segment.state, segment.country].filter(Boolean).join(", ") || 'N/A';
                const distance = (segment.distance * distanceFactor).toFixed(2);
                return `
⭐ **${segment.name}** (ID: ${segment.id})
   - Activity Type: ${segment.activity_type}
   - Distance: ${distance} ${distanceUnit}
   - Avg Grade: ${segment.average_grade}%
   - Location: ${location}
   - Private: ${segment.private ? 'Yes' : 'No'}
          `.trim();
            }).join("\n---\n");

            const responseText = `**Your Starred Segments:**\n\n${segmentText}`;

            return { content: [{ type: "text" as const, text: responseText }] };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
            log.error("Error in list-starred-segments tool:", errorMessage);
            return {
                content: [{ type: "text" as const, text: `❌ API Error: ${errorMessage}` }],
                isError: true,
            };
        }
    }
};

// Remove the old registration function
/*
export function registerListStarredSegmentsTool(server: McpServer) {
    server.tool(
        listStarredSegments.name,
        listStarredSegments.description,
        listStarredSegments.execute // No input schema
    );
}
*/ 