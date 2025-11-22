import { z } from "zod";
import { getAthleteStats as fetchAthleteStats } from '../../client/stravaClient.js';
import { StravaStatsType } from '../../schema/index.js';
import { formatStat } from '../../utils/formatters.js';
import { createLogger } from '../../utils/logger.js';
import { fileURLToPath } from "url";
import { StravaAuthRepository } from "../../repository/strava_auth_repository.js";
import { AUTH_ERROR_RESPONSE } from "../../utils/constants.js";
import { generateErrorResponse, generateSuccessResponse } from "../../utils/responseGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

const GetAthleteStatsInputSchema = z.object({
    strava_athlete_id: z.string()
        .describe("The Strava athlete ID for authentication"),
    athleteId: z.number().int().positive().describe("The unique identifier of the athlete to fetch stats for. Obtain this ID first by calling the get-athlete-profile tool.")
});

type GetAthleteStatsInput = z.infer<typeof GetAthleteStatsInputSchema>;

function formatStats(stats: StravaStatsType): string {
    const format = (label: string, total: number | null | undefined, unit: 'km' | 'm' | 'hrs', count?: number | null, time?: number | null) => {
        let line = `   - ${label}: ${formatStat(total, unit)}`;
        if (count !== undefined && count !== null) line += ` (${count} activities)`;
        if (time !== undefined && time !== null) line += ` / ${formatStat(time, 'hrs')} hours`;
        return line;
    };

    let response = "📊 **Your Strava Stats:**\n";

    if (stats.biggest_ride_distance !== undefined) {
        response += "**Rides:**\n";
        response += format("Biggest Ride", stats.biggest_ride_distance, 'km') + '\n';
    }
    if (stats.recent_ride_totals) {
        response += "*Recent Rides (last 4 weeks):*\n";
        response += format("Distance", stats.recent_ride_totals.distance, 'km', stats.recent_ride_totals.count, stats.recent_ride_totals.moving_time) + '\n';
        response += format("Elevation Gain", stats.recent_ride_totals.elevation_gain, 'm') + '\n';
    }
    if (stats.ytd_ride_totals) {
        response += "*Year-to-Date Rides:*\n";
        response += format("Distance", stats.ytd_ride_totals.distance, 'km', stats.ytd_ride_totals.count, stats.ytd_ride_totals.moving_time) + '\n';
        response += format("Elevation Gain", stats.ytd_ride_totals.elevation_gain, 'm') + '\n';
    }
    if (stats.all_ride_totals) {
        response += "*All-Time Rides:*\n";
        response += format("Distance", stats.all_ride_totals.distance, 'km', stats.all_ride_totals.count, stats.all_ride_totals.moving_time) + '\n';
        response += format("Elevation Gain", stats.all_ride_totals.elevation_gain, 'm') + '\n';
    }


    if (stats.recent_run_totals) {
        response += "*Recent Runs (last 4 weeks):*\n";
        response += format("Distance", stats.recent_run_totals.distance, 'km', stats.recent_run_totals.count, stats.recent_run_totals.moving_time) + '\n';
        response += format("Elevation Gain", stats.recent_run_totals.elevation_gain, 'm') + '\n';
    }
    if (stats.ytd_run_totals) {
        response += "*Year-to-Date Runs:*\n";
        response += format("Distance", stats.ytd_run_totals.distance, 'km', stats.ytd_run_totals.count, stats.ytd_run_totals.moving_time) + '\n';
        response += format("Elevation Gain", stats.ytd_run_totals.elevation_gain, 'm') + '\n';
    }
    if (stats.all_run_totals) {
        response += "*All-Time Runs:*\n";
        response += format("Distance", stats.all_run_totals.distance, 'km', stats.all_run_totals.count, stats.all_run_totals.moving_time) + '\n';
        response += format("Elevation Gain", stats.all_run_totals.elevation_gain, 'm') + '\n';
    }

    return response.trim();
}

export const makeTool = (stravaAuthRepository: StravaAuthRepository) => {
    return {
        name: "get-athlete-stats",
        description: "Fetches statistics for a specified athlete. Requires the athlete's numeric ID, which can be obtained using the get-athlete-profile tool.",
        inputSchema: GetAthleteStatsInputSchema,
        execute: makeExecuteFn(stravaAuthRepository)
    }
}

const makeExecuteFn = (stravaAuthRepository: StravaAuthRepository) => {
    return async ({ strava_athlete_id, athleteId }: GetAthleteStatsInput) => {
        const token = await stravaAuthRepository.fetchAccessToken(strava_athlete_id);

        if (!token) {
            log.error("Missing STRAVA_ACCESS_TOKEN");
            return AUTH_ERROR_RESPONSE;
        }

        try {
            log.info(`Fetching stats for athlete ${athleteId}...`);
            const stats = await fetchAthleteStats(token, athleteId);
            const formattedStats = formatStats(stats);
            return generateSuccessResponse(formattedStats);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log.error(`Error fetching stats for athlete ${athleteId}: ${errorMessage}`);
            const userFriendlyMessage = errorMessage.includes("Record Not Found") || errorMessage.includes("404")
                ? `Athlete with ID ${athleteId} not found (when fetching stats).`
                : `An unexpected error occurred while fetching stats for athlete ${athleteId}. Details: ${errorMessage}`;
            return generateErrorResponse(`❌ ${userFriendlyMessage}`);
        }
    }
}
