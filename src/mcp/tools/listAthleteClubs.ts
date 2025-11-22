import { z } from "zod";
import { listAthleteClubs as fetchClubs } from '../../client/stravaClient.js';
import { createLogger } from '../../utils/logger.js';
import { fileURLToPath } from "url";
import { StravaAuthRepository } from "../../repository/strava_auth_repository.js";
import { AUTH_ERROR_RESPONSE } from "../../utils/constants.js";
import { generateErrorResponse, generateSuccessResponse } from "../../utils/responseGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

const ListAthleteClubsInputSchema = z.object({
    strava_athlete_id: z.string()
        .describe("The Strava athlete ID for authentication"),
});

type ListAthleteClubsInput = z.infer<typeof ListAthleteClubsInputSchema>;

export const makeTool = (stravaAuthRepository: StravaAuthRepository) => {
    return {
        name: "list-athlete-clubs",
        description: "Lists the clubs the authenticated athlete is a member of.",
        inputSchema: ListAthleteClubsInputSchema,
        execute: makeExecuteFn(stravaAuthRepository)
    }
}

const makeExecuteFn = (stravaAuthRepository: StravaAuthRepository) => {
    return async ({ strava_athlete_id }: ListAthleteClubsInput) => {
        const token = await stravaAuthRepository.fetchAccessToken(strava_athlete_id);

        if (!token) {
            log.error("Missing or placeholder STRAVA_ACCESS_TOKEN");
            return AUTH_ERROR_RESPONSE;
        }

        try {
            log.info("Fetching athlete clubs...");
            const clubs = await fetchClubs(token);
            log.info(`Successfully fetched ${clubs?.length ?? 0} clubs.`);

            if (!clubs || clubs.length === 0) {
                return generateErrorResponse("No clubs found for the athlete.");
            }

            const clubText = clubs.map(club =>
                `👥 **${club.name}** (ID: ${club.id})
   - Sport: ${club.sport_type}
   - Members: ${club.member_count}
   - Location: ${club.city}, ${club.state}, ${club.country}
   - Private: ${club.private ? 'Yes' : 'No'}
   - URL: ${club.url || 'N/A'}`
            ).join("\n---\n");

            return generateSuccessResponse(`**Your Strava Clubs:**\n\n${clubText}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
            log.error("Error in list-athlete-clubs tool:", errorMessage);
            return generateErrorResponse(`❌ API Error: ${errorMessage}`);
        }
    }
}