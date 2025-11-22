import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createLogger } from "./logger.js";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");
const envPath = path.join(projectRoot, ".env");
const log = createLogger(__filename);

const configSchema = z.object({
  stravaClientId: z.string().nonempty("STRAVA_CLIENT_ID is required"),
  stravaClientSecret: z.string().nonempty("STRAVA_CLIENT_SECRET is required"),
  stravaRedirectUri: z.string().url().optional().default("http://localhost:3000/callback"),
  dbConnectionString: z.string().optional(),
  dbPass: z.string().default("pass"),
  dbHost: z.string().default("localhost"),
  dbUser: z.string().default("postgres"),
  dbPort: z.string().default(""),
  dbName: z.string().default("postgres"),
  PORT: z.number().int().optional().default(3000),
});

export type Config = z.infer<typeof configSchema>;

export const loadConfigFromEnv = (): Config => {
  dotenv.config({ path: envPath });
  log.info(`Configuration loaded from ${envPath}`);
  return prepareConfigObject();
};

const prepareConfigObject = () => {
  const config = {
    stravaClientId: process.env.STRAVA_CLIENT_ID || "",
    stravaClientSecret: process.env.STRAVA_CLIENT_SECRET || "",
    stravaRedirectUri: process.env.STRAVA_REDIRECT_URI,
    dbConnectionString: process.env.DB_URL,
    dbPass: process.env.DB_PASS,
    dbHost: process.env.DB_HOST,
    dbUser: process.env.DB_USER,
    dbPort: process.env.DB_PORT,
    dbName: process.env.DB_NAME,
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  };

  const parsed = configSchema.safeParse(config);
  if (!parsed.success) {
    log.error("Invalid configuration:");
    parsed.error.errors.forEach((err) => {
      log.error(` - ${err.message}`);
    });
    throw new Error("Configuration validation failed");
  }

  return parsed.data;
};

export /**
 * Updates the .env file with new access and refresh tokens
 * @param accessToken - The new access token
 * @param refreshToken - The new refresh token
 */
  async function updateTokensInEnvFile(
    accessToken: string,
    refreshToken: string
  ): Promise<void> {
  try {
    let envContent = await fs.readFile(envPath, "utf-8");
    const lines = envContent.split("\n");
    const newLines: string[] = [];
    let accessTokenUpdated = false;
    let refreshTokenUpdated = false;

    for (const line of lines) {
      if (line.startsWith("STRAVA_ACCESS_TOKEN=")) {
        newLines.push(`STRAVA_ACCESS_TOKEN=${accessToken}`);
        accessTokenUpdated = true;
      } else if (line.startsWith("STRAVA_REFRESH_TOKEN=")) {
        newLines.push(`STRAVA_REFRESH_TOKEN=${refreshToken}`);
        refreshTokenUpdated = true;
      } else if (line.trim() !== "") {
        newLines.push(line);
      }
    }

    if (!accessTokenUpdated) {
      newLines.push(`STRAVA_ACCESS_TOKEN=${accessToken}`);
    }
    if (!refreshTokenUpdated) {
      newLines.push(`STRAVA_REFRESH_TOKEN=${refreshToken}`);
    }

    await fs.writeFile(envPath, newLines.join("\n").trim() + "\n");
    log.info("Tokens successfully refreshed and updated in .env file.");
  } catch (error) {
    log.error(
      `Failed to update tokens in .env file: ${error instanceof Error ? error.message : String(error)
      }`
    );
    // Continue execution even if file update fails
  }
}
