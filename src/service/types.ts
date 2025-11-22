import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

// Interface for getAllActivities parameters
export interface GetAllActivitiesParams {
    page?: number;
    perPage?: number;
    before?: number; // epoch timestamp in seconds
    after?: number; // epoch timestamp in seconds
    onProgress?: (fetched: number, page: number) => void;
}

// Interface for segment efforts parameters
export interface SegmentEffortsParams {
    startDateLocal?: string;
    endDateLocal?: string;
    perPage?: number;
}

