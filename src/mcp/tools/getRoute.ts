import { z } from "zod";
import { getRouteById /*, handleApiError */ } from '../../client/stravaClient.js'; // Removed handleApiError import
import { formatRouteSummary } from '../../utils/formatters.js'; // Import shared formatter

import { createLogger } from '../../utils/logger.js';
import { fileURLToPath } from "url";
import { StravaAuthRepository } from "../../repository/strava_auth_repository.js";
import { AUTH_ERROR_RESPONSE } from "../../utils/constants.js";
import { generateErrorResponse, generateSuccessResponse } from "../../utils/responseGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

// Zod schema for input validation
const GetRouteInputSchema = z.object({
    strava_athlete_id: z.string()
        .describe("The Strava athlete ID for authentication"),
    routeId: z.string()
        .regex(/^\d+$/, "Route ID must contain only digits")
        .refine(val => val.length > 0, "Route ID cannot be empty")
        .describe("The unique identifier of the route to fetch.")
});

type GetRouteInput = z.infer<typeof GetRouteInputSchema>;

export const makeTool = (stravaAuthRepository: StravaAuthRepository) => {
    return {
        name: "get-route",
        description: "Fetches detailed information about a specific route using its ID.",
        inputSchema: GetRouteInputSchema,
        execute: makeExecuteFn(stravaAuthRepository)
    }
}

const makeExecuteFn = (stravaAuthRepository: StravaAuthRepository) => {
    return async (input: GetRouteInput) => {
        const { strava_athlete_id, routeId } = input;
        const token = await stravaAuthRepository.fetchAccessToken(strava_athlete_id);

        if (!token) {
            log.error("Missing STRAVA_ACCESS_TOKEN environment variable.");
            return AUTH_ERROR_RESPONSE;
        }

        try {
            log.info(`Fetching route details for ID: ${routeId}...`);
            const route = await getRouteById(token, routeId);
            const summary = formatRouteSummary(route); // Call shared formatter without units

            log.info(`Successfully fetched route ${routeId}.`);
            return generateSuccessResponse(summary);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log.error(`Error fetching route ${routeId}: ${errorMessage}`);
            const userFriendlyMessage = errorMessage.includes("Record Not Found") || errorMessage.includes("404")
                ? `Route with ID ${routeId} not found.`
                : `An unexpected error occurred while fetching route ${routeId}. Details: ${errorMessage}`;
            return generateErrorResponse(`❌ ${userFriendlyMessage}`);
        }
    }
}