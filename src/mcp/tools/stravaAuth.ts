

import { createLogger } from "../../utils/logger.js";
import { fileURLToPath } from "url";
import { Config } from "../../utils/config.js";
import { generateSuccessResponse } from "../../utils/responseGenerator.js";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

const inputSchema = z.object({});

const outputSchema = z.object({
    redirect: z.boolean(),
    message: z.string(),
    redirect_url: z.string(),
    meta: z.object({
        reason: z.string(),
        timestamp: z.string()
    })
});

export const makeTool = (config: Config) => {
    return {
        name: "strava-auth",
        description: "Authenticates with Strava using the provided credentials.",
        inputSchema: inputSchema,
        execute: makeExecuteFn(config),
        outputSchema: outputSchema
    }
}

const makeExecuteFn = (config: Config) => {
    return async () => {
        log.info("Authenticating with Strava...");
        log.info("Redirecting to the auth page...");
        const structuredData = {
            redirect: true,
            message: "Redirecting to the requested resource.",
            redirect_url: `${config.stravaRedirectUri}/auth`,
            meta: {
                reason: "For authenticating with Strava",
                timestamp: new Date().toISOString()
            }
        }
        log.info(`Response :: ${JSON.stringify(generateSuccessResponse(JSON.stringify(structuredData), structuredData))}`);
        return generateSuccessResponse(JSON.stringify(structuredData), structuredData);
    }
}
