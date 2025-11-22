import { z } from "zod";
import { fileURLToPath } from "url";
import { getAuthenticatedAthlete, listStarredSegments as fetchSegments } from '../../client/stravaClient.js';
import { createLogger } from '../../utils/logger.js';
import { StravaAuthRepository } from "../../repository/strava_auth_repository.js";
import { AUTH_ERROR_RESPONSE } from "../../utils/constants.js";
import { generateErrorResponse, generateSuccessResponse } from "../../utils/responseGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

const ListStarredSegmentsInputSchema = z.object({
    strava_athlete_id: z.string()
        .describe("The Strava athlete ID for authentication"),
});

type ListStarredSegmentsInput = z.infer<typeof ListStarredSegmentsInputSchema>;

export const makeTool = (stravaAuthRepository: StravaAuthRepository) => {
    return {
        name: "list-starred-segments",
        description: "Lists the segments starred by the authenticated athlete.",
        inputSchema: ListStarredSegmentsInputSchema,
        execute: makeExecuteFn(stravaAuthRepository)
    }
}

const makeExecuteFn = (stravaAuthRepository: StravaAuthRepository) => {
    return async ({ strava_athlete_id }: ListStarredSegmentsInput) => {
        const token = await stravaAuthRepository.fetchAccessToken(strava_athlete_id);

        if (!token) {
            log.error("Missing or placeholder STRAVA_ACCESS_TOKEN");
            return AUTH_ERROR_RESPONSE;
        }

        try {
            log.info("Fetching starred segments...");
            const athlete = await getAuthenticatedAthlete(token);
            const segments = await fetchSegments(token);
            log.info(`Successfully fetched ${segments?.length ?? 0} starred segments.`);

            if (!segments || segments.length === 0) {
                return generateErrorResponse("No starred segments found.");
            }

            const distanceFactor = athlete.measurement_preference === 'feet' ? 0.000621371 : 0.001;
            const distanceUnit = athlete.measurement_preference === 'feet' ? 'mi' : 'km';
            const elevationFactor = athlete.measurement_preference === 'feet' ? 3.28084 : 1;
            const elevationUnit = athlete.measurement_preference === 'feet' ? 'ft' : 'm';

            const segmentSummaries = segments.map(segment => {
                const distance = (segment.distance * distanceFactor).toFixed(2);
                let elevDiff = 'N/A';
                if (segment.elevation_high != null && segment.elevation_low != null) {
                    elevDiff = ((segment.elevation_high - segment.elevation_low) * elevationFactor).toFixed(0);
                }
                return `🗺️ **${segment.name}** (ID: ${segment.id})
   - Distance: ${distance} ${distanceUnit}
   - Avg Grade: ${segment.average_grade}%
   - Elev Difference: ${elevDiff} ${elevationUnit}
   - Activity Type: ${segment.activity_type}`;
            });

            return generateSuccessResponse(`**Starred Segments:**\n\n${segmentSummaries.join("\n---\n")}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
            log.error("Error in list-starred-segments tool:", errorMessage);
            return generateErrorResponse(`❌ API Error: ${errorMessage}`);
        }
    }
}