import { createLogger } from '../utils/logger.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

import { StravaSegmentType, StravaSegmentsResponseSchema, StravaDetailedSegmentType, DetailedSegmentSchema, StravaExplorerResponseType, ExplorerResponseSchema } from '../schema/index.js';
import { stravaApi, handleApiError } from '../client/stravaClient.js';

/**
 * Lists the segments starred by the authenticated athlete.
 *
 * @param accessToken - The Strava API access token.
 * @returns A promise that resolves to an array of the athlete's starred segments.
 * @throws Throws an error if the API request fails or the response format is unexpected.
 */
export async function listStarredSegments(accessToken: string): Promise<StravaSegmentType[]> {
    if (!accessToken) {
        throw new Error("Strava access token is required.");
    }

    try {
        // Strava API uses page/per_page but often defaults reasonably for lists like this.
        // Add pagination parameters if needed later.
        const response = await stravaApi.get<unknown>("segments/starred", {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const validationResult = StravaSegmentsResponseSchema.safeParse(response.data);

        if (!validationResult.success) {
            log.error("Strava API validation failed (listStarredSegments):", validationResult.error);
            throw new Error(`Invalid data format received from Strava API: ${validationResult.error.message}`);
        }
        return validationResult.data;

    } catch (error) {
        return await handleApiError<StravaSegmentType[]>(error, 'listStarredSegments', async () => {
            // Use new token from environment after refresh
            const newToken = process.env.STRAVA_ACCESS_TOKEN!;
            return listStarredSegments(newToken);
        });
    }
}

/**
 * Fetches detailed information for a specific segment by its ID.
 *
 * @param accessToken - The Strava API access token.
 * @param segmentId - The ID of the segment to fetch.
 * @returns A promise that resolves to the detailed segment data.
 * @throws Throws an error if the API request fails or the response format is unexpected.
 */
export async function getSegmentById(accessToken: string, segmentId: number): Promise<StravaDetailedSegmentType> {
    if (!accessToken) {
        throw new Error("Strava access token is required.");
    }
    if (!segmentId) {
        throw new Error("Segment ID is required.");
    }

    try {
        const response = await stravaApi.get<unknown>(`segments/${segmentId}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const validationResult = DetailedSegmentSchema.safeParse(response.data);

        if (!validationResult.success) {
            log.error(`Strava API validation failed (getSegmentById: ${segmentId}):`, validationResult.error);
            throw new Error(`Invalid data format received from Strava API: ${validationResult.error.message}`);
        }
        return validationResult.data;

    } catch (error) {
        return await handleApiError<StravaDetailedSegmentType>(error, `getSegmentById for ID ${segmentId}`, async () => {
            // Use new token from environment after refresh
            const newToken = process.env.STRAVA_ACCESS_TOKEN!;
            return getSegmentById(newToken, segmentId);
        });
    }
}

/**
 * Returns the top 10 segments matching a specified query.
 *
 * @param accessToken - The Strava API access token.
 * @param bounds - String representing the latitudes and longitudes for the corners of the search map, `latitude,longitude,latitude,longitude`.
 * @param activityType - Optional filter for activity type ("running" or "riding").
 * @param minCat - Optional minimum climb category filter.
 * @param maxCat - Optional maximum climb category filter.
 * @returns A promise that resolves to the explorer response containing matching segments.
 * @throws Throws an error if the API request fails or the response format is unexpected.
 */
export async function exploreSegments(
    accessToken: string,
    bounds: string,
    activityType?: 'running' | 'riding',
    minCat?: number,
    maxCat?: number
): Promise<StravaExplorerResponseType> {
    if (!accessToken) {
        throw new Error("Strava access token is required.");
    }
    if (!bounds || !/^-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(bounds)) {
        throw new Error("Valid bounds (lat,lng,lat,lng) are required for exploring segments.");
    }

    const params: Record<string, any> = {
        bounds: bounds,
    };
    if (activityType) params.activity_type = activityType;
    if (minCat !== undefined) params.min_cat = minCat;
    if (maxCat !== undefined) params.max_cat = maxCat;

    try {
        const response = await stravaApi.get<unknown>("segments/explore", {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: params
        });

        const validationResult = ExplorerResponseSchema.safeParse(response.data);

        if (!validationResult.success) {
            log.error("Strava API validation failed (exploreSegments):", validationResult.error);
            throw new Error(`Invalid data format received from Strava API: ${validationResult.error.message}`);
        }
        return validationResult.data;

    } catch (error) {
        return await handleApiError<StravaExplorerResponseType>(error, `exploreSegments with bounds ${bounds}`, async () => {
            // Use new token from environment after refresh
            const newToken = process.env.STRAVA_ACCESS_TOKEN!;
            return exploreSegments(newToken, bounds, activityType);
        });
    }
}

/**
 * Stars or unstars a segment for the authenticated athlete.
 *
 * @param accessToken - The Strava API access token.
 * @param segmentId - The ID of the segment to star/unstar.
 * @param starred - Boolean indicating whether to star (true) or unstar (false) the segment.
 * @returns A promise that resolves to the detailed segment data after the update.
 * @throws Throws an error if the API request fails or the response format is unexpected.
 */
export async function starSegment(accessToken: string, segmentId: number, starred: boolean): Promise<StravaDetailedSegmentType> {
    if (!accessToken) {
        throw new Error("Strava access token is required.");
    }
    if (!segmentId) {
        throw new Error("Segment ID is required to star/unstar.");
    }
    if (starred === undefined) {
        throw new Error("Starred status (true/false) is required.");
    }

    try {
        const response = await stravaApi.put<unknown>(
            `segments/${segmentId}/starred`,
            { starred: starred }, // Data payload for the PUT request
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json' // Important for PUT requests with body
                }
            }
        );

        // The response is expected to be the updated DetailedSegment
        const validationResult = DetailedSegmentSchema.safeParse(response.data);

        if (!validationResult.success) {
            log.error(`Strava API validation failed (starSegment: ${segmentId}):`, validationResult.error);
            throw new Error(`Invalid data format received from Strava API: ${validationResult.error.message}`);
        }
        return validationResult.data;

    } catch (error) {
        return await handleApiError<StravaDetailedSegmentType>(error, `starSegment for ID ${segmentId} with starred=${starred}`, async () => {
            // Use new token from environment after refresh
            const newToken = process.env.STRAVA_ACCESS_TOKEN!;
            return starSegment(newToken, segmentId, starred);
        });
    }
}

