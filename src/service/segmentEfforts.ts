import { z } from "zod";
import { StravaDetailedSegmentEffortType, DetailedSegmentEffortSchema } from '../schema/index.js';
import { stravaApi, handleApiError } from '../client/stravaClient.js';
import { SegmentEffortsParams } from "./types.js";

/**
 * Fetches detailed information about a specific segment effort by its ID.
 *
 * @param accessToken - The Strava API access token.
 * @param effortId - The ID of the segment effort to fetch.
 * @returns A promise that resolves to the detailed segment effort data.
 * @throws Throws an error if the API request fails or the response format is unexpected.
 */
export async function getSegmentEffort(accessToken: string, effortId: number): Promise<StravaDetailedSegmentEffortType> {
    if (!accessToken) {
        throw new Error("Strava access token is required.");
    }
    if (!effortId) {
        throw new Error("Segment Effort ID is required to fetch details.");
    }

    try {
        const response = await stravaApi.get<unknown>(`segment_efforts/${effortId}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const validationResult = DetailedSegmentEffortSchema.safeParse(response.data);

        if (!validationResult.success) {
            console.error(`Strava API validation failed (getSegmentEffort: ${effortId}):`, validationResult.error);
            throw new Error(`Invalid data format received from Strava API: ${validationResult.error.message}`);
        }
        return validationResult.data;

    } catch (error) {
        return await handleApiError<StravaDetailedSegmentEffortType>(error, `getSegmentEffort for ID ${effortId}`, async () => {
            // Use new token from environment after refresh
            const newToken = process.env.STRAVA_ACCESS_TOKEN!;
            return getSegmentEffort(newToken, effortId);
        });
    }
}

/**
 * Fetches a list of segment efforts for a given segment, filtered by date range for the authenticated athlete.
 *
 * @param accessToken - The Strava API access token.
 * @param segmentId - The ID of the segment.
 * @param startDateLocal - Optional ISO 8601 start date.
 * @param endDateLocal - Optional ISO 8601 end date.
 * @param perPage - Optional number of items per page.
 * @returns A promise that resolves to an array of segment efforts.
 * @throws Throws an error if the API request fails or the response format is unexpected.
 */
export async function listSegmentEfforts(
    accessToken: string,
    segmentId: number,
    params: SegmentEffortsParams = {}
): Promise<StravaDetailedSegmentEffortType[]> {
    if (!accessToken) {
        throw new Error("Strava access token is required.");
    }
    if (!segmentId) {
        throw new Error("Segment ID is required to list efforts.");
    }

    const { startDateLocal, endDateLocal, perPage } = params;

    const queryParams: Record<string, any> = {
        segment_id: segmentId,
    };
    if (startDateLocal) queryParams.start_date_local = startDateLocal;
    if (endDateLocal) queryParams.end_date_local = endDateLocal;
    if (perPage) queryParams.per_page = perPage;

    try {
        const response = await stravaApi.get<unknown>("segment_efforts", {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: queryParams
        });

        // Response is an array of DetailedSegmentEffort
        const validationResult = z.array(DetailedSegmentEffortSchema).safeParse(response.data);

        if (!validationResult.success) {
            console.error(`Strava API validation failed (listSegmentEfforts: segment ${segmentId}):`, validationResult.error);
            throw new Error(`Invalid data format received from Strava API: ${validationResult.error.message}`);
        }
        return validationResult.data;

    } catch (error) {
        return await handleApiError<StravaDetailedSegmentEffortType[]>(error, `listSegmentEfforts for segment ID ${segmentId}`, async () => {
            // Use new token from environment after refresh
            const newToken = process.env.STRAVA_ACCESS_TOKEN!;
            return listSegmentEfforts(newToken, segmentId, params);
        });
    }
}

