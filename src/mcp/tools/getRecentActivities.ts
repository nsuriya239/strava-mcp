import { z } from "zod";
import { getRecentActivities as fetchActivities } from '../../client/stravaClient.js';
import { fileURLToPath } from "url";
import { createLogger } from '../../utils/logger.js';
import { StravaAuthRepository } from "../../repository/strava_auth_repository.js";
import { AUTH_ERROR_RESPONSE } from "../../utils/constants.js";
import { generateErrorResponse, generateSuccessResponse } from "../../utils/responseGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

const GetRecentActivitiesInputSchema = z.object({
  strava_athlete_id: z.string()
    .describe("The Strava athlete ID for authentication"),
  perPage: z.number().int().positive().optional().default(30).describe("Number of activities to retrieve (default: 30)"),
});

type GetRecentActivitiesInput = z.infer<typeof GetRecentActivitiesInputSchema>;

export const makeTool = (stravaAuthRepository: StravaAuthRepository) => {
  return {
    name: "get-recent-activities",
    description: "Fetches the most recent activities for the authenticated athlete.",
    inputSchema: GetRecentActivitiesInputSchema,
    execute: makeExecuteFn(stravaAuthRepository)
  }
}

const makeExecuteFn = (stravaAuthRepository: StravaAuthRepository) => {
  return async ({ strava_athlete_id, perPage }: GetRecentActivitiesInput) => {
    const token = await stravaAuthRepository.fetchAccessToken(strava_athlete_id);

    if (!token) {
      log.error("Missing or placeholder STRAVA_ACCESS_TOKEN");
      return AUTH_ERROR_RESPONSE;
    }

    try {
      log.info(`Fetching ${perPage} recent activities...`);
      const activities = await fetchActivities(token, perPage);
      log.info(`Successfully fetched ${activities?.length ?? 0} activities.`);

      if (!activities || activities.length === 0) {
        return generateErrorResponse("No recent activities found.");
      }

      // Map to content items with literal type
      const contentItems = activities.map(activity => {
        const dateStr = activity.start_date ? new Date(activity.start_date).toLocaleDateString() : 'N/A';
        const distanceStr = activity.distance ? `${activity.distance}m` : 'N/A';
        return `🏃 ${activity.name} (ID: ${activity.id ?? 'N/A'}) — ${distanceStr} on ${dateStr}`;
      });

      return generateSuccessResponse(contentItems.join("\n"));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      log.error("Error in get-recent-activities tool:", errorMessage);
      return generateErrorResponse(`❌ API Error: ${errorMessage}`);
    }
  }
}