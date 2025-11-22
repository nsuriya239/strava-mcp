import { z } from "zod";
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from "url";
import { exportRouteGpx as fetchGpxData } from '../../client/stravaClient.js';
import { createLogger } from '../../utils/logger.js';
import { StravaAuthRepository } from "../../repository/strava_auth_repository.js";
import { AUTH_ERROR_RESPONSE } from "../../utils/constants.js";
import { generateErrorResponse, generateSuccessResponse } from "../../utils/responseGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

// Define the input schema for the tool
const ExportRouteGpxInputSchema = z.object({
    strava_athlete_id: z.string()
        .describe("The Strava athlete ID for authentication"),
    routeId: z.string().describe("The ID of the Strava route to export."),
});

// Infer the input type from the schema
type ExportRouteGpxInput = z.infer<typeof ExportRouteGpxInputSchema>;

export const makeTool = (stravaAuthRepository: StravaAuthRepository) => {
    return {
        name: "export-route-gpx",
        description: "Exports a specific Strava route in GPX format and saves it to a pre-configured local directory.",
        inputSchema: ExportRouteGpxInputSchema,
        execute: makeExecuteFn(stravaAuthRepository)
    }
}

const makeExecuteFn = (stravaAuthRepository: StravaAuthRepository) => {
    return async ({ strava_athlete_id, routeId }: ExportRouteGpxInput) => {
        const token = await stravaAuthRepository.fetchAccessToken(strava_athlete_id);
        if (!token) {
            log.error("Missing or placeholder STRAVA_ACCESS_TOKEN");
            return AUTH_ERROR_RESPONSE;
        }

        const exportDir = process.env.ROUTE_EXPORT_PATH;
        if (!exportDir) {
            return generateErrorResponse("❌ Error: Missing ROUTE_EXPORT_PATH in .env file. Please configure the directory for saving exports.");
        }

        try {
            // Ensure the directory exists, create if not
            if (!fs.existsSync(exportDir)) {
                log.error(`Export directory ${exportDir} not found, creating it...`);
                fs.mkdirSync(exportDir, { recursive: true });
            } else {
                // Check if it's a directory and writable (existing logic)
                const stats = fs.statSync(exportDir);
                if (!stats.isDirectory()) {
                    return generateErrorResponse(`❌ Error: ROUTE_EXPORT_PATH (${exportDir}) is not a valid directory.`);
                }
                fs.accessSync(exportDir, fs.constants.W_OK);
            }

            const gpxData = await fetchGpxData(token, routeId);
            const filename = `route-${routeId}.gpx`;
            const fullPath = path.join(exportDir, filename);
            fs.writeFileSync(fullPath, gpxData);

            return generateSuccessResponse(`✅ Route ${routeId} exported successfully as GPX to: ${fullPath}`);

        } catch (err: any) {
            log.error(`Error in export-route-gpx tool for route ${routeId}:`, err);
            let userMessage = `❌ Error exporting route ${routeId} as GPX: ${err.message}`;
            if (err.code === 'EACCES') {
                userMessage = `❌ Error: No write permission for ROUTE_EXPORT_PATH directory (${exportDir}).`;
            }
            return generateErrorResponse(userMessage);
        }
    }
}