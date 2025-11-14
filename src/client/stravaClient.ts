import axios from "axios";

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// --- Axios Instance & Interceptor --- 
// Create an Axios instance to apply interceptors globally for this client
export const stravaApi = axios.create({
    baseURL: 'https://www.strava.com/api/v3'
});

// Add a request interceptor (can be used for logging or modifying requests)
stravaApi.interceptors.request.use(config => {
    // REMOVE DEBUG LOGS - Interfere with MCP Stdio transport
    // let authHeaderLog = 'Not Set';
    // const authHeaderValue = config.headers?.Authorization;
    // if (typeof authHeaderValue === 'string') {
    //     authHeaderLog = `${authHeaderValue.substring(0, 12)}...[REDACTED]`;
    // }
    // console.error(`[DEBUG stravaClient] Sending Request: ${config.method?.toUpperCase()} ${config.url}`);
    // console.error(`[DEBUG stravaClient] Authorization Header: ${authHeaderLog}` );
    return config;
}, error => {
    console.error('[DEBUG stravaClient] Request Error Interceptor:', error);
    return Promise.reject(error);
});
// ----------------------------------


// --- Token Refresh Functionality ---
// Calculate path to .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');

/**
 * Updates the .env file with new access and refresh tokens
 * @param accessToken - The new access token
 * @param refreshToken - The new refresh token
 */
async function updateTokensInEnvFile(accessToken: string, refreshToken: string): Promise<void> {
    try {
        let envContent = await fs.readFile(envPath, 'utf-8');
        const lines = envContent.split('\n');
        const newLines: string[] = [];
        let accessTokenUpdated = false;
        let refreshTokenUpdated = false;

        for (const line of lines) {
            if (line.startsWith('STRAVA_ACCESS_TOKEN=')) {
                newLines.push(`STRAVA_ACCESS_TOKEN=${accessToken}`);
                accessTokenUpdated = true;
            } else if (line.startsWith('STRAVA_REFRESH_TOKEN=')) {
                newLines.push(`STRAVA_REFRESH_TOKEN=${refreshToken}`);
                refreshTokenUpdated = true;
            } else if (line.trim() !== '') {
                newLines.push(line);
            }
        }

        if (!accessTokenUpdated) {
            newLines.push(`STRAVA_ACCESS_TOKEN=${accessToken}`);
        }
        if (!refreshTokenUpdated) {
            newLines.push(`STRAVA_REFRESH_TOKEN=${refreshToken}`);
        }

        await fs.writeFile(envPath, newLines.join('\n').trim() + '\n');
        console.error('✅ Tokens successfully refreshed and updated in .env file.');
    } catch (error) {
        console.error('Failed to update tokens in .env file:', error);
        // Continue execution even if file update fails
    }
}

/**
 * Refreshes the Strava API access token using the refresh token
 * @returns The new access token
 */
async function refreshAccessToken(): Promise<string> {
    const refreshToken = process.env.STRAVA_REFRESH_TOKEN;
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (!refreshToken || !clientId || !clientSecret) {
        throw new Error("Missing refresh credentials in .env (STRAVA_REFRESH_TOKEN, STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET)");
    }

    try {
        console.error('🔄 Refreshing Strava access token...');
        const response = await axios.post('https://www.strava.com/oauth/token', {
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token'
        });

        // Update tokens in environment variables for the current process
        const newAccessToken = response.data.access_token;
        const newRefreshToken = response.data.refresh_token;

        if (!newAccessToken || !newRefreshToken) {
            throw new Error('Refresh response missing required tokens');
        }

        process.env.STRAVA_ACCESS_TOKEN = newAccessToken;
        process.env.STRAVA_REFRESH_TOKEN = newRefreshToken;

        // Also update .env file for persistence
        await updateTokensInEnvFile(newAccessToken, newRefreshToken);

        console.error(`✅ Token refreshed. New token expires: ${new Date(response.data.expires_at * 1000).toLocaleString()}`);
        return newAccessToken;
    } catch (error) {
        console.error('Failed to refresh access token:', error);
        throw new Error(`Failed to refresh Strava access token: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Helper function to handle API errors with token refresh capability
 * @param error - The caught error
 * @param context - The context in which the error occurred
 * @param retryFn - Optional function to retry after token refresh
 * @returns Never returns normally, always throws an error or returns via retryFn
 */
export async function handleApiError<T>(error: unknown, context: string, retryFn?: () => Promise<T>): Promise<T> {
    // Check if it's an authentication error (401) that might be fixed by refreshing the token
    if (axios.isAxiosError(error) && error.response?.status === 401 && retryFn) {
        try {
            console.error(`🔑 Authentication error in ${context}. Attempting to refresh token...`);
            await refreshAccessToken();

            // Return the result of the retry function if it succeeds
            console.error(`🔄 Retrying ${context} after token refresh...`);
            return await retryFn();
        } catch (refreshError) {
            console.error(`❌ Token refresh failed: ${refreshError instanceof Error ? refreshError.message : String(refreshError)}`);
            // Fall through to normal error handling if refresh fails
        }
    }

    // Check for subscription error (402)
    if (axios.isAxiosError(error) && error.response?.status === 402) {
        console.error(`🔒 Subscription Required in ${context}. Status: 402`);
        // Throw a specific error type or use a unique message
        throw new Error(`SUBSCRIPTION_REQUIRED: Access to this feature requires a Strava subscription. Context: ${context}`);
    }

    // Standard error handling (existing code)
    if (axios.isAxiosError(error)) {
        const status = error.response?.status || 'Unknown';
        const responseData = error.response?.data;
        const message = (typeof responseData === 'object' && responseData !== null && 'message' in responseData && typeof responseData.message === 'string')
            ? responseData.message
            : error.message;
        console.error(`Strava API request failed in ${context} with status ${status}: ${message}`);
        // Include response data in error log if helpful (be careful with sensitive data)
        if (responseData) {
            console.error(`Response data (${context}):`, JSON.stringify(responseData, null, 2));
        }
        throw new Error(`Strava API Error in ${context} (${status}): ${message}`);
    } else if (error instanceof Error) {
        console.error(`An unexpected error occurred in ${context}:`, error);
        throw new Error(`An unexpected error occurred in ${context}: ${error.message}`);
    } else {
        console.error(`An unknown error object was caught in ${context}:`, error);
        throw new Error(`An unknown error occurred in ${context}: ${String(error)}`);
    }
}

// Re-export all service functions for backward compatibility
export * from '../service/index.js';
