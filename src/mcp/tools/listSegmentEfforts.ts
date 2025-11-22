import { z } from "zod";
import {
    listSegmentEfforts as fetchSegmentEfforts,
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

// Zod schema for input validation
const ListSegmentEffortsInputSchema = z.object({
    strava_athlete_id: z.string()
        .describe("The Strava athlete ID for authentication"),
    segmentId: z.number().int().positive().describe("The ID of the segment for which to list efforts."),
    startDateLocal: z.string().datetime({ message: "Invalid start date format. Use ISO 8601." }).optional().describe("Filter efforts starting after this ISO 8601 date-time (optional)."),
    endDateLocal: z.string().datetime({ message: "Invalid end date format. Use ISO 8601." }).optional().describe("Filter efforts ending before this ISO 8601 date-time (optional)."),
    perPage: z.number().int().positive().max(200).optional().default(30).describe("Number of efforts to return per page (default: 30, max: 200).")
});

type ListSegmentEffortsInput = z.infer<typeof ListSegmentEffortsInputSchema>;


// Format segment effort summary (Metric Only)
function formatSegmentEffort(effort: StravaDetailedSegmentEffortType): string {
    const movingTime = formatDuration(effort.moving_time);
    const elapsedTime = formatDuration(effort.elapsed_time);
    const distance = formatDistance(effort.distance);

    // Basic summary: Effort ID, Date, Moving Time, Distance, PR Rank
    let summary = `⏱️ Effort ID: ${effort.id} (${new Date(effort.start_date_local).toLocaleDateString()})`;
    summary += ` | Time: ${movingTime} (Moving), ${elapsedTime} (Elapsed)`;
    summary += ` | Dist: ${distance}`;
    if (effort.pr_rank !== null) summary += ` | PR Rank: ${effort.pr_rank}`;
    if (effort.kom_rank !== null) summary += ` | KOM Rank: ${effort.kom_rank}`; // Add KOM if available
    return summary;
}

export const makeTool = (stravaAuthRepository: StravaAuthRepository) => {
    return {
        name: "list-segment-efforts",
        description: "Lists the authenticated athlete's efforts on a specific segment, optionally filtering by date.",
        inputSchema: ListSegmentEffortsInputSchema,
        execute: makeExecuteFn(stravaAuthRepository)
    }
}

const makeExecuteFn = (stravaAuthRepository: StravaAuthRepository) => {
    return async ({ strava_athlete_id, segmentId, startDateLocal, endDateLocal, perPage }: ListSegmentEffortsInput) => {
        const token = await stravaAuthRepository.fetchAccessToken(strava_athlete_id);

        if (!token) {
            log.error("Missing STRAVA_ACCESS_TOKEN environment variable.");
            return AUTH_ERROR_RESPONSE;
        }

        try {
            log.info(`Fetching segment efforts for segment ID: ${segmentId}...`);

            // Use the new params object structure
            const efforts = await fetchSegmentEfforts(token, segmentId, {
                startDateLocal,
                endDateLocal,
                perPage
            });

            if (!efforts || efforts.length === 0) {
                log.error(`No efforts found for segment ${segmentId} with the given filters.`);
                return generateErrorResponse(`No efforts found for segment ${segmentId} matching the criteria.`);
            }

            log.error(`Successfully fetched ${efforts.length} efforts for segment ${segmentId}.`);
            const effortSummaries = efforts.map(effort => formatSegmentEffort(effort)); // Use metric formatter
            const responseText = `**Segment ${segmentId} Efforts:**\n\n${effortSummaries.join("\n")}`;

            return generateSuccessResponse(responseText);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log.error(`Error listing efforts for segment ${segmentId}: ${errorMessage}`);

            let userFriendlyMessage;
            if (errorMessage.startsWith("SUBSCRIPTION_REQUIRED:")) {
                userFriendlyMessage = `🔒 Accessing segment efforts requires a Strava subscription. Please check your subscription status.`;
            } else if (errorMessage.includes("Record Not Found") || errorMessage.includes("404")) {
                userFriendlyMessage = `Segment with ID ${segmentId} not found (when listing efforts).`;
            } else {
                userFriendlyMessage = `An unexpected error occurred while listing efforts for segment ${segmentId}. Details: ${errorMessage}`;
            }

            return generateErrorResponse(`❌ ${userFriendlyMessage}`);
        }
    }
}