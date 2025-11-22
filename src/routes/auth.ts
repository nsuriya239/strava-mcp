import { Request, Response } from "express";
import { fileURLToPath } from "url";
import { createLogger } from "../utils/logger.js";
import { Config } from "../utils/config.js";
import { StravaAuthRepository } from "../repository/strava_auth_repository.js";

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

    const callbackUrl = `${config.stravaRedirectUri}/callback`;
    const scopes =
      "profile:read_all,activity:read_all,activity:read,profile:write";
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${config.stravaClientId
      }&response_type=code&redirect_uri=${encodeURIComponent(
        callbackUrl
      )}&approval_prompt=force&scope=${scopes}`;

    res.redirect(authUrl);
  };
};

/**
 * OAuth callback handler - exchanges code for access token
 */
export const authCallbackRoute = (config: Config, stravaAuthRepository: StravaAuthRepository) => {
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

      if (!validateResponse(tokenData)) {
        log.error("Invalid token response from Strava");
        return res.status(500).json({ error: "Invalid token response from Strava" });
      }

      log.info(
        `Successfully exchanged code for access token (athlete_id: ${tokenData.athlete.id})`
      );

      const athlete_id = `${tokenData.athlete?.id}`

      // Return token data to client
      await stravaAuthRepository.upsert(athlete_id, {
        userId: athlete_id,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date((tokenData.expires_at || 0) * 1000),
      });

      return res.send(`
        <html>
          <head>
            <style>
              body {font-family: Arial, sans-serif; padding: 20px; display: flex; align-content: center;justify-content: space-evenly;align-items: center;flex-direction: column;}
              .message {font-size: 1.2em; margin-bottom: 10px;}
              .athlete-id {font-weight: bold;font-size: 1.5em;color: #f5f5f5;background: #3828b1;padding: 10px;display: inline-block;border-radius: 16px}
              .container {display: flex;align-content: center;flex-direction: column;align-items: center;}
            </style>
          </head>
          <body>
          <div class="container">
            <h2>Token exchange successful</h2>
            <p class="message">Please copy and paste the below athlete_id in the agents web interface, so the agent can use it to get your Strava data:</p>
            <div class="athlete-id">${tokenData.athlete?.id}</div>
          </div>
          </body>
        </html>
      `);

    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      log.error(`OAuth callback error: ${errorMessage} ${error} `);
      res.status(500).json({
        error: "Internal server error",
        message: errorMessage,
      });
    }
  };
};

const validateResponse = (response: any) => {
  if (response.access_token && response.refresh_token && response.expires_at && response.athlete && response.athlete.id) {
    return true
  }
  return false
}

