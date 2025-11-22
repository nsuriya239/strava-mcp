// import { McpServer } from "@modelcontextprotocol/sdk/server/mcp"; // Removed
import { z } from "zod";
import {
    getAthleteStats as fetchAthleteStats,
} from '../../client/stravaClient.js';
import { StravaStatsType } from '../../schema/index.js';
import { formatStat } from '../../utils/formatters.js';

import { createLogger } from '../../utils/logger.js';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

// Input schema: Now requires athleteId
const GetAthleteStatsInputSchema = z.object({
    strava_athlete_id: z.string()
        .describe("The Strava athlete ID for authentication"),
    athleteId: z.number().int().positive().describe("The unique identifier of the athlete to fetch stats for. Obtain this ID first by calling the get-athlete-profile tool.")
});

// Define type alias for input
type GetAthleteStatsInput = z.infer<typeof GetAthleteStatsInputSchema>;




// Format athlete stats (metric only)
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

    // Similar blocks for Runs and Swims if needed...
    if (stats.recent_run_totals || stats.ytd_run_totals || stats.all_run_totals) {
        response += "\n**Runs:**\n";
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
    }

    // Add Swims similarly if needed

    return response;
}

// Tool definition
export const getAthleteStatsTool = {
    name: "get-athlete-stats",
    description: "Fetches the activity statistics (recent, YTD, all-time) for a specific athlete using their ID. Requires the athleteId obtained from the get-athlete-profile tool.",
    inputSchema: GetAthleteStatsInputSchema,
    execute: async ({ strava_athlete_id, athleteId }: GetAthleteStatsInput) => {
        const token = process.env.STRAVA_ACCESS_TOKEN;

        if (!token) {
            log.error("Missing STRAVA_ACCESS_TOKEN environment variable.");
            return {
                content: [{ type: "text" as const, text: "Configuration error: Missing Strava access token." }],
                isError: true
            };
        }

        try {
            log.info(`Fetching stats for athlete ${athleteId}...`);
            const stats = await fetchAthleteStats(token, athleteId);
            const formattedStats = formatStats(stats);

            log.info(`Successfully fetched stats for athlete ${athleteId}.`);
            return { content: [{ type: "text" as const, text: formattedStats }] };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log.error(`Error fetching stats for athlete ${athleteId}: ${errorMessage}`);
            const userFriendlyMessage = errorMessage.includes("Record Not Found") || errorMessage.includes("404")
                ? `Athlete with ID ${athleteId} not found (when fetching stats).`
                : `An unexpected error occurred while fetching stats for athlete ${athleteId}. Details: ${errorMessage}`;
            return {
                content: [{ type: "text" as const, text: `❌ ${userFriendlyMessage}` }],
                isError: true
            };
        }
    }
};
