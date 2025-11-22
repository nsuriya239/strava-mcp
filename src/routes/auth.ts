import { Request, Response } from "express";
import { fileURLToPath } from "url";
import { createLogger } from "../utils/logger.js";
import { Config } from "../utils/config.js";
import { StravaAuthRepository } from "../repository/strava_auth_repository.js";

const stravaAuthRepository = new StravaAuthRepository();

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

/**
 * Initiate OAuth flow - redirects to Strava authorization
 */
export const authRoute = (config: Config) => {
  return (_req: Request, res: Response) => {
    log.debug("Starting OAuth flow - redirecting to Strava");
    if (!config.stravaClientId) {
      log.error("Missing STRAVA_CLIENT_ID");
      return res.status(500).json({ error: "OAuth configuration error" });
    }

    const scopes =
      "profile:read_all,activity:read_all,activity:read,profile:write";
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${config.stravaClientId
      }&response_type=code&redirect_uri=${encodeURIComponent(
        config.stravaRedirectUri
      )}&approval_prompt=force&scope=${scopes}`;

    res.redirect(authUrl);
  };
};

/**
 * OAuth callback handler - exchanges code for access token
 */
export const authCallbackRoute = (config: Config) => {
  return async (req: Request, res: Response) => {
    const { code, error, error_description } = req.query;

    // Handle authorization denial
    if (error) {
      log.warn(`OAuth error: ${error} - ${error_description}`);
      return res.status(400).json({
        error: error as string,
        description: error_description as string,
      });
    }

    if (!code || typeof code !== "string") {
      log.error("Missing authorization code in callback");
      return res.status(400).json({ error: "Missing authorization code" });
    }

    if (!config.stravaClientId || !config.stravaClientSecret) {
      log.error("Missing OAuth credentials (CLIENT_ID or CLIENT_SECRET)");
      return res.status(500).json({ error: "OAuth configuration error" });
    }

    try {
      // Exchange code for access token
      const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: config.stravaClientId,
          client_secret: config.stravaClientSecret,
          code: code,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json();
        log.error(`Token exchange failed: ${JSON.stringify(error)}`);
        return res.status(tokenResponse.status).json({
          error: "Token exchange failed",
          details: error,
        });
      }

      const tokenData = await tokenResponse.json();

      log.info(
        `Successfully exchanged code for access token (athlete_id: ${tokenData.athlete?.id})`
      );

      const athlete_id = String(tokenData.athlete?.id)

      // Return token data to client
      await stravaAuthRepository.upsert(athlete_id, {
        userId: tokenData.athlete?.id,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(tokenData.expires_at * 1000),
      });

      return res.json({
        status: "success",
        message: "Token exchange successful, Please copy and paste the below athlete_id in the agents web interface, so the agent can use it to get your strava data",
        data: {
          athlete_id: tokenData.athlete?.id,
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      log.error(`OAuth callback error: ${errorMessage} ${error}`);
      res.status(500).json({
        error: "Internal server error",
        message: errorMessage,
      });
    }
  };
};

