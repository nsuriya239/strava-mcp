// import { McpServer } from "@modelcontextprotocol/sdk/server/mcp"; // Removed
import { z } from "zod";
import {
    getSegmentEffort as fetchSegmentEffort,
} from '../../client/stravaClient.js';
import { StravaDetailedSegmentEffortType } from '../../schema/index.js';
import { formatDistance, formatDuration } from '../../utils/formatters.js';

import { createLogger } from '../../utils/logger.js';
import { fileURLToPath } from "url";
import { StravaAuthRepository } from "../../repository/strava_auth_repository.js";
import { AUTH_ERROR_RESPONSE } from "../../utils/constants.js";
import { generateErrorResponse, generateSuccessResponse } from "../../utils/responseGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

const GetSegmentEffortInputSchema = z.object({
    strava_athlete_id: z.string()
        .describe("The Strava athlete ID for authentication"),
    effortId: z.number().int().positive().describe("The unique identifier of the segment effort to fetch.")
});

type GetSegmentEffortInput = z.infer<typeof GetSegmentEffortInputSchema>;


// Format segment effort details (Metric Only)
function formatSegmentEffort(effort: StravaDetailedSegmentEffortType): string {
    const movingTime = formatDuration(effort.moving_time);
    const elapsedTime = formatDuration(effort.elapsed_time);
    const distance = formatDistance(effort.distance);
    // Remove speed/pace calculations as fields are not available on effort object
    // const avgSpeed = formatSpeed(effort.average_speed);
    // const maxSpeed = formatSpeed(effort.max_speed);
    // const avgPace = formatPace(effort.average_speed);

    let details = `⏱️ **Segment Effort: ${effort.name}** (ID: ${effort.id})\n`;
    details += `   - Activity ID: ${effort.activity.id}, Athlete ID: ${effort.athlete.id}\n`;
    details += `   - Segment ID: ${effort.segment.id}\n`;
    details += `   - Date: ${new Date(effort.start_date_local).toLocaleString()}\n`;
    details += `   - Moving Time: ${movingTime}, Elapsed Time: ${elapsedTime}\n`;
    if (effort.distance !== undefined) details += `   - Distance: ${distance}\n`;
    // Remove speed/pace display lines
    // if (effort.average_speed !== undefined) { ... }
    // if (effort.max_speed !== undefined) { ... }
    if (effort.average_cadence !== undefined && effort.average_cadence !== null) details += `   - Avg Cadence: ${effort.average_cadence.toFixed(1)}\n`;
    if (effort.average_watts !== undefined && effort.average_watts !== null) details += `   - Avg Watts: ${effort.average_watts.toFixed(1)}\n`;
    if (effort.average_heartrate !== undefined && effort.average_heartrate !== null) details += `   - Avg Heart Rate: ${effort.average_heartrate.toFixed(1)} bpm\n`;
    if (effort.max_heartrate !== undefined && effort.max_heartrate !== null) details += `   - Max Heart Rate: ${effort.max_heartrate.toFixed(0)} bpm\n`;
    if (effort.kom_rank !== null) details += `   - KOM Rank: ${effort.kom_rank}\n`;
    if (effort.pr_rank !== null) details += `   - PR Rank: ${effort.pr_rank}\n`;
    details += `   - Hidden: ${effort.hidden ? 'Yes' : 'No'}\n`;

    return details;
}

export const makeTool = (stravaAuthRepository: StravaAuthRepository) => {
    return {
        name: "get-segment-effort",
        description: "Fetches detailed information about a specific segment effort using its ID.",
        inputSchema: GetSegmentEffortInputSchema,
        execute: makeExecuteFn(stravaAuthRepository)
    }
}

const makeExecuteFn = (stravaAuthRepository: StravaAuthRepository) => {
    return async ({ strava_athlete_id, effortId }: GetSegmentEffortInput) => {
        const token = await stravaAuthRepository.fetchAccessToken(strava_athlete_id);

        if (!token) {
            log.error("Missing STRAVA_ACCESS_TOKEN environment variable.");
            return AUTH_ERROR_RESPONSE;
        }

        try {
            log.info(`Fetching details for segment effort ID: ${effortId}...`);
            // Removed getAuthenticatedAthlete call
            const effort = await fetchSegmentEffort(token, effortId);
            const effortDetailsText = formatSegmentEffort(effort); // Use metric formatter

            log.info(`Successfully fetched details for effort: ${effort.name}`);
            return generateSuccessResponse(effortDetailsText);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log.error(`Error fetching segment effort ${effortId}: ${errorMessage}`);

            let userFriendlyMessage;
            if (errorMessage.startsWith("SUBSCRIPTION_REQUIRED:")) {
                userFriendlyMessage = `🔒 Accessing this segment effort (ID: ${effortId}) requires a Strava subscription. Please check your subscription status.`;
            } else if (errorMessage.includes("Record Not Found") || errorMessage.includes("404")) {
                userFriendlyMessage = `Segment effort with ID ${effortId} not found.`;
            } else {
                userFriendlyMessage = `An unexpected error occurred while fetching segment effort ${effortId}. Details: ${errorMessage}`;
            }

            return generateErrorResponse(`❌ ${userFriendlyMessage}`);
        }
    }
}