import { z } from "zod";
import { getAuthenticatedAthlete } from '../../client/stravaClient.js';

import { createLogger } from '../../utils/logger.js';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

const GetAthleteProfileInputSchema = z.object({
  strava_athlete_id: z.string()
    .describe("The Strava athlete ID for authentication"),
});

type GetAthleteProfileInput = z.infer<typeof GetAthleteProfileInputSchema>;

// Export the tool definition directly
export const getAthleteProfile = {
  name: "get-athlete-profile",
  description: "Fetches the profile information for the authenticated athlete, including their unique numeric ID needed for other tools like get-athlete-stats.",
  inputSchema: GetAthleteProfileInputSchema,
  execute: async ({ strava_athlete_id }: GetAthleteProfileInput) => { // No input parameters needed
    const token = process.env.STRAVA_ACCESS_TOKEN;

    if (!token || token === 'YOUR_STRAVA_ACCESS_TOKEN_HERE') {
      log.error("Missing or placeholder STRAVA_ACCESS_TOKEN in .env");
      return {
        content: [{ type: "text" as const, text: "❌ Configuration Error: STRAVA_ACCESS_TOKEN is missing or not set in the .env file." }],
        isError: true,
      };
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

      // Ensure return object matches expected structure
      const response = {
        content: [{ type: "text" as const, text: profileParts.join("\n") }]
      };
      return response;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      log.error("Error in get-athlete-profile tool:", errorMessage);
      return {
        content: [{ type: "text" as const, text: `❌ API Error: ${errorMessage}` }],
        isError: true,
      };
    }
  }
};

// Removed old registration function
/*
export function registerGetAthleteProfileTool(server: McpServer) {
  server.tool(
    getAthleteProfile.name,
    getAthleteProfile.description,
    getAthleteProfile.execute // No input schema
  );
}
*/ 