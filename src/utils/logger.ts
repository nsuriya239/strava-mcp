import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define log colors
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};

// Tell winston about our colors
winston.addColors(colors);

// Define console format with colors
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(
        (info) => `${info.timestamp} [${info.level}] [${info.filename || 'unknown'}]: ${info.message}`
    )
);

// Define which transports to use
const transports = [
    // Console transport
    new winston.transports.Console({
        format: consoleFormat,
    }),
];

// Create the base logger
const baseLogger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels,
    transports,
});

/**
 * Creates a logger instance with the filename automatically included in all log messages
 * @param filename - The __filename value from the calling module (use fileURLToPath(import.meta.url))
 * @returns A winston logger instance with filename context
 */
export function createLogger(filename: string) {
    // Extract just the filename from the full path
    const basename = path.basename(filename);

    // Create a child logger with the filename in the default metadata
    return baseLogger.child({ filename: basename });
}

// Export the base logger as well for cases where filename context isn't needed
export default baseLogger;
