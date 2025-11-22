import { StravaActivitiesResponseSchema, StravaDetailedActivityType, DetailedActivitySchema, StravaLapType, StravaLapsResponseSchema } from '../schema/index.js';
import { stravaApi, handleApiError } from '../client/stravaClient.js';
import { GetAllActivitiesParams } from "./types.js";
import { createLogger } from '../utils/logger.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

/**
 * Fetches recent activities for the authenticated athlete from the Strava API.
 *
 * @param accessToken - The Strava API access token.
 * @param perPage - The number of activities to fetch per page (default: 30).
 * @returns A promise that resolves to an array of Strava activities.
 * @throws Throws an error if the API request fails or the response format is unexpected.
 */
export async function getRecentActivities(accessToken: string, perPage = 30): Promise<any[]> {
    if (!accessToken) {
        throw new Error("Strava access token is required.");
    }

    try {
        const response = await stravaApi.get<unknown>("athlete/activities", {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { per_page: perPage }
        });

        const validationResult = StravaActivitiesResponseSchema.safeParse(response.data);

        if (!validationResult.success) {
            log.error("Strava API response validation failed (getRecentActivities):", validationResult.error);
            throw new Error(`Invalid data format received from Strava API: ${validationResult.error.message}`);
        }

        return validationResult.data;
    } catch (error) {
        // Pass a retry function to handleApiError
        return await handleApiError<any[]>(error, 'getRecentActivities', async () => {
            // Use new token from environment after refresh
            const newToken = process.env.STRAVA_ACCESS_TOKEN!;
            return getRecentActivities(newToken, perPage);
        });
    }
}

/**
 * Fetches all activities for the authenticated athlete with pagination and date filtering.
 * Automatically handles multiple pages to retrieve complete activity history.
 *
 * @param accessToken - The Strava API access token.
 * @param params - Parameters for filtering and pagination.
 * @returns A promise that resolves to an array of all matching Strava activities.
 * @throws Throws an error if the API request fails or the response format is unexpected.
 */
export async function getAllActivities(
    accessToken: string,
    params: GetAllActivitiesParams = {}
): Promise<any[]> {
    if (!accessToken) {
        throw new Error("Strava access token is required.");
    }

    const {
        page = 1,
        perPage = 200, // Max allowed by Strava
        before,
        after,
        onProgress
    } = params;

    const allActivities: any[] = [];
    let currentPage = page;
    let hasMore = true;

    try {
        while (hasMore) {
            // Build query parameters
            const queryParams: Record<string, any> = {
                page: currentPage,
                per_page: perPage
            };

            // Add date filters if provided
            if (before !== undefined) queryParams.before = before;
            if (after !== undefined) queryParams.after = after;

            // Fetch current page
            const response = await stravaApi.get<unknown>("athlete/activities", {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: queryParams
            });

            log.debug(`Fetched page ${currentPage} with params: ${JSON.stringify(queryParams)}`);

            const validationResult = StravaActivitiesResponseSchema.safeParse(response.data);

            if (!validationResult.success) {
                log.error(`Strava API response validation failed (getAllActivities page ${currentPage}):`, validationResult.error);
                throw new Error(`Invalid data format received from Strava API: ${validationResult.error.message}`);
            }

            const activities = validationResult.data;

            // Add activities to collection
            allActivities.push(...activities);

            // Report progress if callback provided
            if (onProgress) {
                onProgress(allActivities.length, currentPage);
            }

            // Check if we should continue
            // Stop if we got fewer activities than requested (indicating last page)
            hasMore = activities.length === perPage;
            currentPage++;

            // Add a small delay to be respectful of rate limits
            if (hasMore) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        // log.debug(`Activity fetch completed. Output response: ${JSON.stringify(allActivities)}`);

        return allActivities;
    } catch (error) {
        // If it's an auth error and we're on first page, try token refresh
        if (currentPage === 1) {
            return await handleApiError<any[]>(error, 'getAllActivities', async () => {
                const newToken = process.env.STRAVA_ACCESS_TOKEN!;
                return getAllActivities(newToken, params);
            });
        }
        // For subsequent pages, just throw the error
        throw error;
    }
}

/**
 * Fetches detailed information for a specific activity by its ID.
 *
 * @param accessToken - The Strava API access token.
 * @param activityId - The ID of the activity to fetch.
 * @returns A promise that resolves to the detailed activity data.
 * @throws Throws an error if the API request fails or the response format is unexpected.
 */
export async function getActivityById(accessToken: string, activityId: number): Promise<StravaDetailedActivityType> {
    if (!accessToken) {
        throw new Error("Strava access token is required.");
    }
    if (!activityId) {
        throw new Error("Activity ID is required to fetch details.");
    }

    try {
        const response = await stravaApi.get<unknown>(`activities/${activityId}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const validationResult = DetailedActivitySchema.safeParse(response.data);

        if (!validationResult.success) {
            log.error(`Strava API validation failed (getActivityById: ${activityId}):`, validationResult.error);
            throw new Error(`Invalid data format received from Strava API: ${validationResult.error.message}`);
        }
        return validationResult.data;

    } catch (error) {
        return await handleApiError<StravaDetailedActivityType>(error, `getActivityById for ID ${activityId}`, async () => {
            // Use new token from environment after refresh
            const newToken = process.env.STRAVA_ACCESS_TOKEN!;
            return getActivityById(newToken, activityId);
        });
    }
}

/**
 * Retrieves the laps for a specific activity.
 * @param accessToken The Strava API access token.
 * @param activityId The ID of the activity.
 * @returns A promise resolving to an array of lap objects.
 */
export async function getActivityLaps(accessToken: string, activityId: number | string): Promise<StravaLapType[]> {
    if (!accessToken) {
        throw new Error("Strava access token is required.");
    }

    try {
        const response = await stravaApi.get(`/activities/${activityId}/laps`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const validationResult = StravaLapsResponseSchema.safeParse(response.data);

        if (!validationResult.success) {
            log.error(`Strava API validation failed (getActivityLaps: ${activityId}):`, validationResult.error);
            throw new Error(`Invalid data format received from Strava API: ${validationResult.error.message}`);
        }

        return validationResult.data;
    } catch (error) {
        return await handleApiError<StravaLapType[]>(error, `getActivityLaps(${activityId})`, async () => {
            // Use new token from environment after refresh
            const newToken = process.env.STRAVA_ACCESS_TOKEN!;
            return getActivityLaps(newToken, activityId);
        });
    }
}

