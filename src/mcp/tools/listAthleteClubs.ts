import { z } from "zod";
import { listAthleteClubs as fetchClubs } from '../../client/stravaClient.js'; // Renamed import

import { createLogger } from '../../utils/logger.js';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

const ListAthleteClubsInputSchema = z.object({
    strava_athlete_id: z.string()
        .describe("The Strava athlete ID for authentication"),
});

type ListAthleteClubsInput = z.infer<typeof ListAthleteClubsInputSchema>;

// Export the tool definition directly
export const listAthleteClubs = {
    name: "list-athlete-clubs",
    description: "Lists the clubs the authenticated athlete is a member of.",
    inputSchema: ListAthleteClubsInputSchema,
    execute: async ({ strava_athlete_id }: ListAthleteClubsInput) => {
        const token = process.env.STRAVA_ACCESS_TOKEN;

        if (!token || token === 'YOUR_STRAVA_ACCESS_TOKEN_HERE') {
            log.error("Missing or placeholder STRAVA_ACCESS_TOKEN in .env");
            return {
                content: [{ type: "text" as const, text: "❌ Configuration Error: STRAVA_ACCESS_TOKEN is missing or not set in the .env file." }],
                isError: true,
            };
        }

        try {
            log.info("Fetching athlete clubs...");
            const clubs = await fetchClubs(token);
            log.info(`Successfully fetched ${clubs?.length ?? 0} clubs.`);

            if (!clubs || clubs.length === 0) {
                return { content: [{ type: "text" as const, text: " MNo clubs found for the athlete." }] };
            }

            const clubText = clubs.map(club =>
                `
👥 **${club.name}** (ID: ${club.id})
   - Sport: ${club.sport_type}
   - Members: ${club.member_count}
   - Location: ${club.city}, ${club.state}, ${club.country}
   - Private: ${club.private ? 'Yes' : 'No'}
   - URL: ${club.url || 'N/A'}
        `.trim()
            ).join("\n---\n");

            const responseText = `**Your Strava Clubs:**\n\n${clubText}`;

            return { content: [{ type: "text" as const, text: responseText }] };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
            log.error("Error in list-athlete-clubs tool:", errorMessage);
            return {
                content: [{ type: "text" as const, text: `❌ API Error: ${errorMessage}` }],
                isError: true,
            };
        }
    }
};

// Remove the old registration function
/*
export function registerListAthleteClubsTool(server: McpServer) {
    server.tool(
        listAthleteClubs.name,
        listAthleteClubs.description,
        listAthleteClubs.execute // No input schema
    );
}
*/ 