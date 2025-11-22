import { generateErrorResponse } from "./responseGenerator.js";

export const AUTHENTICATION_ERROR = "❌ Configuration Error: User is not authenticated. Please ask the user to authenticate.";

export const AUTH_ERROR_RESPONSE = generateErrorResponse(AUTHENTICATION_ERROR);