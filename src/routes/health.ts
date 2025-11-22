import { Request, Response } from 'express';
import { createLogger } from '../utils/logger.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

export const healthCheckRoute = () => {
    return (_req: Request, res: Response) => {
        log.debug('Health check requested');
        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'strava-mcp'
        });
    };
};