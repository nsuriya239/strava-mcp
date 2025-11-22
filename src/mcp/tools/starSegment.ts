import { z } from "zod";
import { starSegment as updateStarStatus } from '../../client/stravaClient.js'; // Renamed import

import { createLogger } from '../../utils/logger.js';
import { fileURLToPath } from "url";
import { StravaAuthRepository } from "../../repository/strava_auth_repository.js";
import { AUTH_ERROR_RESPONSE } from "../../utils/constants.js";
import { generateErrorResponse, generateSuccessResponse } from "../../utils/responseGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

const StarSegmentInputSchema = z.object({
    strava_athlete_id: z.string()
        .describe("The Strava athlete ID for authentication"),
    segmentId: z.number().int().positive().describe("The unique identifier of the segment to star or unstar."),
    starred: z.boolean().describe("Set to true to star the segment, false to unstar it."),
});

type StarSegmentInput = z.infer<typeof StarSegmentInputSchema>;

export const makeTool = (stravaAuthRepository: StravaAuthRepository) => {
    return {
        name: "star-segment",
        description: "Stars or unstars a specific segment for the authenticated athlete.",
        inputSchema: StarSegmentInputSchema,
        execute: makeExecuteFn(stravaAuthRepository)
    }
}

const makeExecuteFn = (stravaAuthRepository: StravaAuthRepository) => {
    return async ({ strava_athlete_id, segmentId, starred }: StarSegmentInput) => {
        const token = await stravaAuthRepository.fetchAccessToken(strava_athlete_id);

        if (!token) {
            log.error("Missing or placeholder STRAVA_ACCESS_TOKEN in .env");
            return AUTH_ERROR_RESPONSE;
        }

        try {
            const action = starred ? 'starring' : 'unstarring';
            log.info(`Attempting to ${action} segment ID: ${segmentId}...`);

            const updatedSegment = await updateStarStatus(token, segmentId, starred);

            const successMessage = `Successfully ${action} segment: "${updatedSegment.name}" (ID: ${updatedSegment.id}). Its starred status is now: ${updatedSegment.starred}.`;
            log.info(successMessage);

            return generateSuccessResponse(successMessage);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
            const action = starred ? 'star' : 'unstar';
            log.error(`Error attempting to ${action} segment ID ${segmentId}:`, errorMessage);
            return generateErrorResponse(`❌ API Error: Failed to ${action} segment ${segmentId}. ${errorMessage}`);
        }
    }
}