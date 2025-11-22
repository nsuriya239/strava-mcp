import { createLogger } from '../utils/logger.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

import { StravaAthleteType, DetailedAthleteSchema, StravaStatsType, ActivityStatsSchema, StravaAthleteZonesType, AthleteZonesSchema } from '../schema/index.js';
import { stravaApi, handleApiError } from '../client/stravaClient.js';

/**
 * Fetches profile information for the authenticated athlete.
 *
 * @param accessToken - The Strava API access token.
 * @returns A promise that resolves to the detailed athlete profile.
 * @throws Throws an error if the API request fails or the response format is unexpected.
 */
export async function getAuthenticatedAthlete(accessToken: string): Promise<StravaAthleteType> {
    if (!accessToken) {
        throw new Error("Strava access token is required.");
    }

    try {
        const response = await stravaApi.get<unknown>("athlete", {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        // Validate the response data against the Zod schema
        const validationResult = DetailedAthleteSchema.safeParse(response.data);

        if (!validationResult.success) {
            // Log the raw response data on validation failure for debugging
            log.error("Strava API raw response data (getAuthenticatedAthlete):", JSON.stringify(response.data, null, 2));
            log.error("Strava API response validation failed (getAuthenticatedAthlete):", validationResult.error);
            throw new Error(`Invalid data format received from Strava API: ${validationResult.error.message}`);
        }
        // Type assertion is safe here due to successful validation
        return validationResult.data;

    } catch (error) {
        return await handleApiError<StravaAthleteType>(error, 'getAuthenticatedAthlete', async () => {
            // Use new token from environment after refresh
            const newToken = process.env.STRAVA_ACCESS_TOKEN!;
            return getAuthenticatedAthlete(newToken);
        });
    }
}

/**
 * Fetches activity statistics for a specific athlete.
 *
 * @param accessToken - The Strava API access token.
 * @param athleteId - The ID of the athlete whose stats are being requested.
 * @returns A promise that resolves to the athlete's activity statistics.
 * @throws Throws an error if the API request fails or the response format is unexpected.
 */
export async function getAthleteStats(accessToken: string, athleteId: number): Promise<StravaStatsType> {
    if (!accessToken) {
        throw new Error("Strava access token is required.");
    }
    if (!athleteId) {
        throw new Error("Athlete ID is required to fetch stats.");
    }

    try {
        const response = await stravaApi.get<unknown>(`athletes/${athleteId}/stats`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const validationResult = ActivityStatsSchema.safeParse(response.data);

        if (!validationResult.success) {
            log.error("Strava API response validation failed (getAthleteStats):", validationResult.error);
            throw new Error(`Invalid data format received from Strava API: ${validationResult.error.message}`);
        }
        return validationResult.data;

    } catch (error) {
        return await handleApiError<StravaStatsType>(error, `getAthleteStats for ID ${athleteId}`, async () => {
            // Use new token from environment after refresh
            const newToken = process.env.STRAVA_ACCESS_TOKEN!;
            return getAthleteStats(newToken, athleteId);
        });
    }
}

/**
 * Retrieves the heart rate and power zones for the authenticated athlete.
 * @param accessToken The Strava API access token.
 * @returns A promise resolving to the athlete's zone data.
 */
export async function getAthleteZones(accessToken: string): Promise<StravaAthleteZonesType> {
    if (!accessToken) {
        throw new Error("Strava access token is required.");
    }

    try {
        const response = await stravaApi.get<unknown>("/athlete/zones", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const validationResult = AthleteZonesSchema.safeParse(response.data);

        if (!validationResult.success) {
            log.error(`Strava API validation failed (getAthleteZones):`, validationResult.error);
            throw new Error(`Invalid data format received from Strava API: ${validationResult.error.message}`);
        }

        return validationResult.data;
    } catch (error) {
        // Note: This endpoint requires profile:read_all scope
        // Handle potential 403 Forbidden if scope is missing, or 402 if it becomes sub-only?
        return await handleApiError<StravaAthleteZonesType>(error, `getAthleteZones`, async () => {
            // Use new token from environment after refresh
            const newToken = process.env.STRAVA_ACCESS_TOKEN!;
            return getAthleteZones(newToken);
        });
    }
}

