import { StravaRouteType, StravaRoutesResponseSchema, RouteSchema } from '../schema/index.js';
import { stravaApi, handleApiError } from '../client/stravaClient.js';

/**
 * Lists routes created by a specific athlete.
 *
 * @param accessToken - The Strava API access token.
 * @param athleteId - The ID of the athlete whose routes are being requested.
 * @param page - Optional page number for pagination.
 * @param perPage - Optional number of items per page.
 * @returns A promise that resolves to an array of the athlete's routes.
 * @throws Throws an error if the API request fails or the response format is unexpected.
 */
export async function listAthleteRoutes(accessToken: string, page = 1, perPage = 30): Promise<StravaRouteType[]> {
    if (!accessToken) {
        throw new Error("Strava access token is required.");
    }

    try {
        const response = await stravaApi.get<unknown>("athlete/routes", {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: {
                page: page,
                per_page: perPage
            }
        });

        const validationResult = StravaRoutesResponseSchema.safeParse(response.data);

        if (!validationResult.success) {
            console.error("Strava API validation failed (listAthleteRoutes):", validationResult.error);
            throw new Error(`Invalid data format received from Strava API: ${validationResult.error.message}`);
        }
        return validationResult.data;

    } catch (error) {
        return await handleApiError<StravaRouteType[]>(error, 'listAthleteRoutes', async () => {
            // Use new token from environment after refresh
            const newToken = process.env.STRAVA_ACCESS_TOKEN!;
            return listAthleteRoutes(newToken, page, perPage);
        });
    }
}

/**
 * Fetches detailed information for a specific route by its ID.
 *
 * @param accessToken - The Strava API access token.
 * @param routeId - The ID of the route to fetch.
 * @returns A promise that resolves to the detailed route data.
 * @throws Throws an error if the API request fails or the response format is unexpected.
 */
export async function getRouteById(accessToken: string, routeId: string): Promise<StravaRouteType> {
    const url = `routes/${routeId}`;
    try {
        const response = await stravaApi.get(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        // Validate the response against the Zod schema
        const validatedRoute = RouteSchema.parse(response.data);
        return validatedRoute;
    } catch (error) {
        return await handleApiError<StravaRouteType>(error, `fetching route ${routeId}`, async () => {
            // Use new token from environment after refresh
            const newToken = process.env.STRAVA_ACCESS_TOKEN!;
            return getRouteById(newToken, routeId);
        });
    }
}

/**
 * Fetches the GPX data for a specific route.
 * Note: This endpoint returns raw GPX data (XML string), not JSON.
 * @param accessToken Strava API access token
 * @param routeId The ID of the route to export
 * @returns Promise resolving to the GPX data as a string
 */
export async function exportRouteGpx(accessToken: string, routeId: string): Promise<string> {
    const url = `routes/${routeId}/export_gpx`;
    try {
        // Expecting text/xml response, Axios should handle it as string
        const response = await stravaApi.get<string>(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
            // Ensure response is treated as text
            responseType: 'text',
        });
        if (typeof response.data !== 'string') {
            throw new Error('Invalid response format received from Strava API for GPX export.');
        }
        return response.data;
    } catch (error) {
        return await handleApiError<string>(error, `exporting route ${routeId} as GPX`, async () => {
            // Use new token from environment after refresh
            const newToken = process.env.STRAVA_ACCESS_TOKEN!;
            return exportRouteGpx(newToken, routeId);
        });
    }
}

/**
 * Fetches the TCX data for a specific route.
 * Note: This endpoint returns raw TCX data (XML string), not JSON.
 * @param accessToken Strava API access token
 * @param routeId The ID of the route to export
 * @returns Promise resolving to the TCX data as a string
 */
export async function exportRouteTcx(accessToken: string, routeId: string): Promise<string> {
    const url = `routes/${routeId}/export_tcx`;
    try {
        // Expecting text/xml response, Axios should handle it as string
        const response = await stravaApi.get<string>(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
            // Ensure response is treated as text
            responseType: 'text',
        });
        if (typeof response.data !== 'string') {
            throw new Error('Invalid response format received from Strava API for TCX export.');
        }
        return response.data;
    } catch (error) {
        return await handleApiError<string>(error, `exporting route ${routeId} as TCX`, async () => {
            // Use new token from environment after refresh
            const newToken = process.env.STRAVA_ACCESS_TOKEN!;
            return exportRouteTcx(newToken, routeId);
        });
    }
}

