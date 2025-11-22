import { z } from "zod";
import { fileURLToPath } from "url";
import {
    getAuthenticatedAthlete,
    exploreSegments as fetchExploreSegments, // Renamed import
} from '../../client/stravaClient.js';
import { StravaExplorerResponseType } from '../../schema/index.js';
import { createLogger } from '../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

const ExploreSegmentsInputSchema = z.object({
    strava_athlete_id: z.string()
        .describe("The Strava athlete ID for authentication"),
    bounds: z.string()
        .regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?$/, "Bounds must be in the format: south_west_lat,south_west_lng,north_east_lat,north_east_lng")
        .describe("The geographical area to search, specified as a comma-separated string: south_west_lat,south_west_lng,north_east_lat,north_east_lng"),
    activityType: z.enum(["running", "riding"])
        .optional()
        .describe("Filter segments by activity type (optional: 'running' or 'riding')."),
    minCat: z.number().int().min(0).max(5).optional()
        .describe("Filter by minimum climb category (optional, 0-5). Requires riding activityType."),
    maxCat: z.number().int().min(0).max(5).optional()
        .describe("Filter by maximum climb category (optional, 0-5). Requires riding activityType."),
});

type ExploreSegmentsInput = z.infer<typeof ExploreSegmentsInputSchema>;

// Export the tool definition directly
export const exploreSegments = {
    name: "explore-segments",
    description: "Searches for popular segments within a given geographical area.",
    inputSchema: ExploreSegmentsInputSchema,
    execute: async ({ strava_athlete_id, bounds, activityType, minCat, maxCat }: ExploreSegmentsInput) => {
        const token = process.env.STRAVA_ACCESS_TOKEN;

        if (!token || token === 'YOUR_STRAVA_ACCESS_TOKEN_HERE') {
            log.error("Missing or placeholder STRAVA_ACCESS_TOKEN in .env");
            return {
                content: [{ type: "text" as const, text: "❌ Configuration Error: STRAVA_ACCESS_TOKEN is missing or not set in the .env file." }],
                isError: true,
            };
        }
        if ((minCat !== undefined || maxCat !== undefined) && activityType !== 'riding') {
            return {
                content: [{ type: "text" as const, text: "❌ Input Error: Climb category filters (minCat, maxCat) require activityType to be 'riding'." }],
                isError: true,
            };
        }

        try {
            log.error(`Exploring segments within bounds: ${bounds}...`);
            const athlete = await getAuthenticatedAthlete(token);
            const response: StravaExplorerResponseType = await fetchExploreSegments(token, bounds, activityType, minCat, maxCat);
            log.error(`Found ${response.segments?.length ?? 0} segments.`);

            if (!response.segments || response.segments.length === 0) {
                return { content: [{ type: "text" as const, text: " MNo segments found in the specified area with the given filters." }] };
            }

            const distanceFactor = athlete.measurement_preference === 'feet' ? 0.000621371 : 0.001;
            const distanceUnit = athlete.measurement_preference === 'feet' ? 'mi' : 'km';
            const elevationFactor = athlete.measurement_preference === 'feet' ? 3.28084 : 1;
            const elevationUnit = athlete.measurement_preference === 'feet' ? 'ft' : 'm';

            const segmentItems = response.segments.map(segment => {
                const distance = (segment.distance * distanceFactor).toFixed(2);
                const elevDifference = (segment.elev_difference * elevationFactor).toFixed(0);
                const text = `
🗺️ **${segment.name}** (ID: ${segment.id})
   - Climb: Cat ${segment.climb_category_desc} (${segment.climb_category})
   - Distance: ${distance} ${distanceUnit}
   - Avg Grade: ${segment.avg_grade}%
   - Elev Difference: ${elevDifference} ${elevationUnit}
   - Starred: ${segment.starred ? 'Yes' : 'No'}
                `.trim();
                const item: { type: "text", text: string } = { type: "text" as const, text };
                return item;
            });

            const responseText = `**Found Segments:**\n\n${segmentItems.map(item => item.text).join("\n---\n")}`;

            return { content: [{ type: "text" as const, text: responseText }] };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
            log.error("Error in explore-segments tool:", errorMessage);
            return {
                content: [{ type: "text" as const, text: `❌ API Error: ${errorMessage}` }],
                isError: true,
            };
        }
    }
};

// Remove the old registration function
/*
export function registerExploreSegmentsTool(server: McpServer) {
    server.tool(
        exploreSegments.name,
        exploreSegments.description,
        exploreSegments.inputSchema.shape,
        exploreSegments.execute
    );
}
*/ 