import { z } from "zod";
import { getAuthenticatedAthlete } from '../../client/stravaClient.js';
import { createLogger } from '../../utils/logger.js'
import { fileURLToPath } from "url";
import { StravaAuthRepository } from "../../repository/strava_auth_repository.js";
import { AUTH_ERROR_RESPONSE } from "../../utils/constants.js";
import { generateErrorResponse, generateSuccessResponse } from "../../utils/responseGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

const GetAthleteProfileInputSchema = z.object({
  strava_athlete_id: z.string()
    .describe("The Strava athlete ID for authentication"),
});

type GetAthleteProfileInput = z.infer<typeof GetAthleteProfileInputSchema>;

export const makeTool = (stravaAuthRepository: StravaAuthRepository) => {
  return {
    name: "get-athlete-profile",
    description: "Fetches the profile information for the authenticated athlete, including their unique numeric ID needed for other tools like get-athlete-stats.",
    inputSchema: GetAthleteProfileInputSchema,
    execute: makeExecuteFn(stravaAuthRepository)
  }
}

const makeExecuteFn = (stravaAuthRepository: StravaAuthRepository) => {
  return async ({ strava_athlete_id }: GetAthleteProfileInput) => {
    const token = await stravaAuthRepository.fetchAccessToken(strava_athlete_id);

    if (!token) {
      log.error("Missing or placeholder STRAVA_ACCESS_TOKEN");
      return AUTH_ERROR_RESPONSE;
    }

    try {
      log.info("Fetching athlete profile...");
      const athlete = await getAuthenticatedAthlete(token);
      log.info(`Successfully fetched profile for ${athlete.firstname} ${athlete.lastname} (ID: ${athlete.id}).`);

      const profileParts = [
        `👤 **Profile for ${athlete.firstname} ${athlete.lastname}** (ID: ${athlete.id})`,
        `   - Username: ${athlete.username || 'N/A'}`,
        `   - Location: ${[athlete.city, athlete.state, athlete.country].filter(Boolean).join(", ") || 'N/A'}`,
        `   - Sex: ${athlete.sex || 'N/A'}`,
        `   - Weight: ${athlete.weight ? `${athlete.weight} kg` : 'N/A'}`,
        `   - Measurement Units: ${athlete.measurement_preference}`,
        `   - Strava Summit Member: ${athlete.summit ? 'Yes' : 'No'}`,
        `   - Profile Image (Medium): ${athlete.profile_medium}`,
        `   - Joined Strava: ${athlete.created_at ? new Date(athlete.created_at).toLocaleDateString() : 'N/A'}`,
        `   - Last Updated: ${athlete.updated_at ? new Date(athlete.updated_at).toLocaleDateString() : 'N/A'}`,
      ];

      return generateSuccessResponse(profileParts.join("\n"));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      log.error("Error in get-athlete-profile tool:", errorMessage);
      return generateErrorResponse(`❌ API Error: ${errorMessage}`);
    }
  }
}