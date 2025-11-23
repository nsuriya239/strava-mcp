// import { McpServer } from "@modelcontextprotocol/sdk/server/mcp"; // Removed
import { z } from "zod";
import {
    getActivityById as fetchActivityById,
} from '../../client/stravaClient.js';
import { DetailedActivitySchema } from '../../schema/index.js';
// import { formatDistance, formatDuration, formatPace, formatSpeed, formatElevation } from '../../utils/formatters.js';
import { createLogger } from '../../utils/logger.js';
import { fileURLToPath } from "url";
import { StravaAuthRepository } from "../../repository/strava_auth_repository.js";
import { AUTH_ERROR_RESPONSE } from "../../utils/constants.js";
import { generateErrorResponse, generateSuccessResponse } from "../../utils/responseGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

// Zod schema for input validation
const GetActivityDetailsInputSchema = z.object({
    strava_athlete_id: z.string()
        .describe("The Strava athlete ID for authentication"),
    activityId: z.number().int().positive().describe("The unique identifier of the activity to fetch details for.")
});

type GetActivityDetailsInput = z.infer<typeof GetActivityDetailsInputSchema>;

const GetActivityDetailsOutputSchema = z.object({
    activity: DetailedActivitySchema,
});


// Format activity details (Metric Only)
// function formatActivityDetails(activity: StravaDetailedActivityType): string {
//     const date = new Date(activity.start_date_local).toLocaleString();
//     const movingTime = formatDuration(activity.moving_time);
//     const elapsedTime = formatDuration(activity.elapsed_time);
//     const distance = formatDistance(activity.distance);
//     const elevation = formatElevation(activity.total_elevation_gain);
//     const avgSpeed = formatSpeed(activity.average_speed);
//     const maxSpeed = formatSpeed(activity.max_speed);
//     const avgPace = formatPace(activity.average_speed); // Calculate pace from speed

//     let details = `🏃 **${activity.name}** (ID: ${activity.id})\n`;
//     details += `   - Type: ${activity.type} (${activity.sport_type})\n`;
//     details += `   - Date: ${date}\n`;
//     details += `   - Moving Time: ${movingTime}, Elapsed Time: ${elapsedTime}\n`;
//     if (activity.distance !== undefined) details += `   - Distance: ${distance}\n`;
//     if (activity.total_elevation_gain !== undefined) details += `   - Elevation Gain: ${elevation}\n`;
//     if (activity.average_speed !== undefined) {
//         details += `   - Average Speed: ${avgSpeed}`;
//         if (activity.type === 'Run') details += ` (Pace: ${avgPace})`;
//         details += '\n';
//     }
//     if (activity.max_speed !== undefined) details += `   - Max Speed: ${maxSpeed}\n`;
//     if (activity.average_cadence !== undefined && activity.average_cadence !== null) details += `   - Avg Cadence: ${activity.average_cadence.toFixed(1)}\n`;
//     if (activity.average_watts !== undefined && activity.average_watts !== null) details += `   - Avg Watts: ${activity.average_watts.toFixed(1)}\n`;
//     if (activity.average_heartrate !== undefined && activity.average_heartrate !== null) details += `   - Avg Heart Rate: ${activity.average_heartrate.toFixed(1)} bpm\n`;
//     if (activity.max_heartrate !== undefined && activity.max_heartrate !== null) details += `   - Max Heart Rate: ${activity.max_heartrate.toFixed(0)} bpm\n`;
//     if (activity.calories !== undefined) details += `   - Calories: ${activity.calories.toFixed(0)}\n`;
//     if (activity.description) details += `   - Description: ${activity.description}\n`;
//     if (activity.gear) details += `   - Gear: ${activity.gear.name}\n`;

//     return details;
// }

export const makeTool = (stravaAuthRepository: StravaAuthRepository) => {
    return {
        name: "get-activity-details",
        description: "Fetches detailed information about a specific activity using its ID.",
        inputSchema: GetActivityDetailsInputSchema,
        execute: makeExecuteFn(stravaAuthRepository),
        outputSchema: GetActivityDetailsOutputSchema,
    }
}

const makeExecuteFn = (stravaAuthRepository: StravaAuthRepository) => {
    return async ({ strava_athlete_id, activityId }: GetActivityDetailsInput) => {
        const token = await stravaAuthRepository.fetchAccessToken(strava_athlete_id);

        if (!token) {
            log.error("Missing STRAVA_ACCESS_TOKEN environment variable.");
            return AUTH_ERROR_RESPONSE;
        }

        try {
            log.info(`Fetching details for activity ID: ${activityId}...`);
            // Removed getAuthenticatedAthlete call
            const activity = await fetchActivityById(token, activityId);
            // const activityDetailsText = formatActivityDetails(activity); // Use metric formatter
            log.info(`Successfully fetched details for activity: ${activity.name}`);

            const structuredResponse = {
                activity: activity,
            }

            return generateSuccessResponse(JSON.stringify(structuredResponse), structuredResponse);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log.error(`Error fetching activity ${activityId}: ${errorMessage}`);
            // Removed call to handleApiError
            const userFriendlyMessage = errorMessage.includes("Record Not Found") || errorMessage.includes("404")
                ? `Activity with ID ${activityId} not found.`
                : `An unexpected error occurred while fetching activity details for ID ${activityId}. Details: ${errorMessage}`;
            return generateErrorResponse(`❌ ${userFriendlyMessage}`);
        }
    }
}