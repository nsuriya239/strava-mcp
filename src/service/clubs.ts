import { createLogger } from '../utils/logger.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

import { StravaClubType, StravaClubsResponseSchema } from '../schema/index.js';
import { stravaApi, handleApiError } from '../client/stravaClient.js';

/**
 * Lists the clubs the authenticated athlete belongs to.
 *
 * @param accessToken - The Strava API access token.
 * @returns A promise that resolves to an array of the athlete's clubs.
 * @throws Throws an error if the API request fails or the response format is unexpected.
 */
export async function listAthleteClubs(accessToken: string): Promise<StravaClubType[]> {
    if (!accessToken) {
        throw new Error("Strava access token is required.");
    }

    try {
        const response = await stravaApi.get<unknown>("athlete/clubs", {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const validationResult = StravaClubsResponseSchema.safeParse(response.data);

        if (!validationResult.success) {
            log.error("Strava API validation failed (listAthleteClubs):", validationResult.error);
            throw new Error(`Invalid data format received from Strava API: ${validationResult.error.message}`);
        }
        return validationResult.data;

    } catch (error) {
        return await handleApiError<StravaClubType[]>(error, 'listAthleteClubs', async () => {
            // Use new token from environment after refresh
            const newToken = process.env.STRAVA_ACCESS_TOKEN!;
            return listAthleteClubs(newToken);
        });
    }
}

