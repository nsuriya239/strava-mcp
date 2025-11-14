import { StravaRouteType } from '../schema/index.js';

/**
 * Converts meters to kilometers, rounding to 2 decimal places.
 * @param meters - Distance in meters.
 * @returns Distance in kilometers as a string (e.g., "10.25 km").
 */
function metersToKmString(meters: number): string {
    if (meters === undefined || meters === null) return 'N/A';
    return (meters / 1000).toFixed(2) + ' km';
}

/**
 * Formats elevation gain in meters.
 * @param meters - Elevation gain in meters.
 * @returns Elevation gain as a string (e.g., "150 m").
 */
export function formatElevation(meters: number | null | undefined): string {
    if (meters === undefined || meters === null) return 'N/A';
    return Math.round(meters) + ' m';
}

/**
 * Formats a Strava route object into a concise summary string using metric units.
 *
 * @param route - The StravaRoute object.
 * @returns A formatted string summarizing the route.
 */
export function formatRouteSummary(route: StravaRouteType): string {
    const distanceKm = metersToKmString(route.distance);
    const elevation = formatElevation(route.elevation_gain);
    const date = new Date(route.created_at).toLocaleDateString();
    const type = route.type === 1 ? 'Ride' : route.type === 2 ? 'Run' : 'Walk'; // Assuming 3 is Walk based on typical Strava usage

    let summary = `📍 Route: ${route.name} (#${route.id})\n`;
    summary += `   - Type: ${type}, Distance: ${distanceKm}, Elevation: ${elevation}\n`;
    summary += `   - Created: ${date}, Segments: ${route.segments?.length ?? 'N/A'}\n`;
    if (route.description) {
        summary += `   - Description: ${route.description.substring(0, 100)}${route.description.length > 100 ? '...' : ''}\n`;
    }
    return summary;
}

// Add other shared formatters here as needed (e.g., formatActivity, formatSegment) 

// --- Helper Functions ---
// Moving formatDuration to utils or keeping it here if broadly used.
// For now, it's imported by getActivityLaps.ts
export function formatDuration(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined || isNaN(seconds) || seconds < 0) {
        return 'N/A';
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts: string[] = [];
    if (hours > 0) {
        parts.push(hours.toString().padStart(2, '0'));
    }
    parts.push(minutes.toString().padStart(2, '0'));
    parts.push(secs.toString().padStart(2, '0'));

    return parts.join(':');
}

// Removed other formatters - they are now local to their respective tools.


export function formatDistance(meters: number | null | undefined): string {
    if (meters === null || meters === undefined) return 'N/A';
    return (meters / 1000).toFixed(2) + ' km';
}


export function formatSpeed(mps: number | null | undefined): string {
    if (mps === null || mps === undefined) return 'N/A';
    return (mps * 3.6).toFixed(1) + ' km/h'; // Convert m/s to km/h
}

export function formatPace(mps: number | null | undefined): string {
    if (mps === null || mps === undefined || mps <= 0) return 'N/A';
    const minutesPerKm = 1000 / (mps * 60);
    const minutes = Math.floor(minutesPerKm);
    const seconds = Math.round((minutesPerKm - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
}

// Helper function to format numbers as strings with labels (metric)
export function formatStat(value: number | null | undefined, unit: 'km' | 'm' | 'hrs'): string {
    if (value === null || value === undefined) return 'N/A';

    let formattedValue: string;
    if (unit === 'km') {
        formattedValue = (value / 1000).toFixed(2);
    } else if (unit === 'm') {
        formattedValue = Math.round(value).toString();
    } else if (unit === 'hrs') {
        formattedValue = (value / 3600).toFixed(1);
    } else {
        formattedValue = value.toString();
    }
    return `${formattedValue} ${unit}`;
}