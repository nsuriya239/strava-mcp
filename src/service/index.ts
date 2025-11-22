import { createLogger } from '../utils/logger.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

// Re-export all service functions and types for convenience
export * from "./activities.js";
export * from "./athlete.js";
export * from "./clubs.js";
export * from "./segments.js";
export * from "./segmentEfforts.js";
export * from "./routes.js";
export * from "./types.js";
