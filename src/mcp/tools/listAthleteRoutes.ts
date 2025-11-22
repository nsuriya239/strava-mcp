import { z } from "zod";
import { listAthleteRoutes as fetchAthleteRoutes } from '../../client/stravaClient.js';
import { StravaRouteType } from '../../schema/index.js';
import { createLogger } from '../../utils/logger.js';
import { fileURLToPath } from "url";
import { StravaAuthRepository } from "../../repository/strava_auth_repository.js";
import { AUTH_ERROR_RESPONSE } from "../../utils/constants.js";
import { generateErrorResponse, generateSuccessResponse } from "../../utils/responseGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

const ListAthleteRoutesInputSchema = z.object({
    strava_athlete_id: z.string()
        .describe("The Strava athlete ID for authentication"),
    page: z.number().int().positive().optional().default(1).describe("Page number for pagination"),
    perPage: z.number().int().positive().min(1).max(50).optional().default(20).describe("Number of routes per page (max 50)"),
});

type ListAthleteRoutesInput = z.infer<typeof ListAthleteRoutesInputSchema>;

function formatRouteSummary(route: StravaRouteType): string {
    const distance = route.distance ? `${(route.distance / 1000).toFixed(1)} km` : 'N/A';
    const elevation = route.elevation_gain ? `${route.elevation_gain.toFixed(0)} m` : 'N/A';

    return `🗺️ **${route.name}** (ID: ${route.id})
   - Distance: ${distance}
   - Elevation: ${elevation}
   - Created: ${new Date(route.created_at).toLocaleDateString()}
   - Type: ${route.type === 1 ? 'Ride' : route.type === 2 ? 'Run' : 'Other'}`;
}

export const makeTool = (stravaAuthRepository: StravaAuthRepository) => {
    return {
        name: "list-athlete-routes",
        description: "Lists the routes created by the authenticated athlete, with pagination.",
        inputSchema: ListAthleteRoutesInputSchema,
        execute: makeExecuteFn(stravaAuthRepository)
    }
}

const makeExecuteFn = (stravaAuthRepository: StravaAuthRepository) => {
    return async ({ strava_athlete_id, page = 1, perPage = 20 }: ListAthleteRoutesInput) => {
        const token = await stravaAuthRepository.fetchAccessToken(strava_athlete_id);

        if (!token) {
            log.error("Missing STRAVA_ACCESS_TOKEN");
            return AUTH_ERROR_RESPONSE;
        }

        try {
            log.info(`Fetching routes (page ${page}, per_page: ${perPage})...`);

            const routes = await fetchAthleteRoutes(token, page, perPage);

            if (!routes || routes.length === 0) {
                return generateErrorResponse("No routes found for the athlete.");
            }

            log.info(`Successfully fetched ${routes.length} routes.`);
            const summaries = routes.map(route => formatRouteSummary(route));
            const responseText = `**Athlete Routes (Page ${page}):**\n\n${summaries.join("\n")}`;

            return generateSuccessResponse(responseText);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
            log.error(`Error listing athlete routes (page ${page}, perPage: ${perPage}): ${errorMessage}`);
            return generateErrorResponse(`❌ API Error: ${errorMessage}`);
        }
    }
}