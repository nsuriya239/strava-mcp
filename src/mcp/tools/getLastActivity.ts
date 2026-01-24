import { z } from "zod";
import { getRecentActivities as fetchActivities } from '../../client/stravaClient.js';
import { fileURLToPath } from "url";
import { createLogger } from '../../utils/logger.js';
import { StravaAuthRepository } from "../../repository/strava_auth_repository.js";
import { AUTH_ERROR_RESPONSE } from "../../utils/constants.js";
import { generateErrorResponse, generateSuccessResponse } from "../../utils/responseGenerator.js";
import { StravaActivitySchema } from "../../schema/activity.js";

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

const GetLastActivityInputSchema = z.object({
    strava_athlete_id: z.string()
        .describe("The Strava athlete ID for authentication"),
});

type GetLastActivityInput = z.infer<typeof GetLastActivityInputSchema>;

const GetLastActivityOutputSchema = z.object({
    activity: StravaActivitySchema
});

export const makeTool = (stravaAuthRepository: StravaAuthRepository) => {
    return {
        name: "get-last-activity",
        description: "Fetches the most recent activity for the authenticated athlete.",
        inputSchema: GetLastActivityInputSchema,
        execute: makeExecuteFn(stravaAuthRepository),
        outputSchema: GetLastActivityOutputSchema
    }
}

const makeExecuteFn = (stravaAuthRepository: StravaAuthRepository) => {
    return async ({ strava_athlete_id }: GetLastActivityInput) => {
        const token = await stravaAuthRepository.fetchAccessToken(strava_athlete_id);

        if (!token) {
            log.error("Missing or placeholder STRAVA_ACCESS_TOKEN");
            return AUTH_ERROR_RESPONSE;
        }

        try {
            const activities = await fetchActivities(token);
            log.info(`Successfully fetched ${activities?.length ?? 0} activities.`);

            if (!activities || activities.length === 0) {
                return generateErrorResponse("No recent activities found.");
            }

            // Map to content items with literal type
            // const contentItems = activities.map(activity => {
            //   const dateStr = activity.start_date ? new Date(activity.start_date).toLocaleDateString() : 'N/A';
            //   const distanceStr = activity.distance ? `${activity.distance}m` : 'N/A';
            //   return `🏃 ${activity.name} (ID: ${activity.id ?? 'N/A'}) — ${distanceStr} on ${dateStr}`;
            // });

            const structuredResponse = {
                activity: activities[0]
            }

            return generateSuccessResponse(JSON.stringify(structuredResponse), structuredResponse);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
            log.error("Error in get-last-activity tool:", errorMessage);
            return generateErrorResponse(`❌ API Error: ${errorMessage}`);
        }
    }
}