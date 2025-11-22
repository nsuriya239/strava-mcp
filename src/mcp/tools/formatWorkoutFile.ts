import { z } from "zod";
import { StravaAuthRepository } from "../../repository/strava_auth_repository.js";
import { generateErrorResponse } from "../../utils/responseGenerator.js";

// Define types for workout segments
interface WorkoutSegment {
    type: string;
    duration: {
        value: number;
        unit: 'min' | 'sec';
    };
    target: string;
    cadence?: number;
    notes?: string;
}

// Helper to convert various intensity targets to Zwift power zones
function targetToZwiftPower(target: string): number {
    // Convert various formats to percentage of FTP
    const targetLower = target.toLowerCase();

    // Handle direct FTP percentages
    const ftpMatch = targetLower.match(/(\d+)%\s*ftp/);
    if (ftpMatch?.[1]) {
        return parseInt(ftpMatch[1]) / 100;
    }

    // Handle common zone descriptions
    const zoneMap: { [key: string]: number } = {
        'very easy': 0.5,    // 50% FTP
        'easy': 0.6,         // 60% FTP
        'zone 1': 0.6,       // 60% FTP
        'zone 2': 0.75,      // 75% FTP
        'moderate': 0.75,    // 75% FTP
        'tempo': 0.85,       // 85% FTP
        'zone 3': 0.85,      // 85% FTP
        'threshold': 1.0,    // 100% FTP
        'zone 4': 1.0,       // 100% FTP
        'hard': 1.05,        // 105% FTP
        'zone 5': 1.1,       // 110% FTP
        'very hard': 1.15,   // 115% FTP
        'max': 1.2,          // 120% FTP
    };

    // Try to match known descriptions
    for (const [desc, power] of Object.entries(zoneMap)) {
        if (targetLower.includes(desc)) {
            return power;
        }
    }

    // Default to moderate intensity if we can't determine
    return 0.75;
}

// Parse a duration string into seconds
function parseDuration(duration: string): { value: number; unit: 'min' | 'sec' } {
    const match = duration.match(/(\d+)\s*(min|sec)/i);
    if (!match?.[1] || !match?.[2]) {
        throw new Error(`Invalid duration format: ${duration}`);
    }

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase() as 'min' | 'sec';

    return { value, unit };
}

// Parse workout text into structured segments
function parseWorkoutText(text: string): WorkoutSegment[] {
    const segments: WorkoutSegment[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
        if (!line.trim().startsWith('-')) continue;

        // Extract the main parts using regex
        const segmentMatch = line.match(/^-\s*([^:]+):\s*(\d+\s*(?:min|sec))\s*at\s*([^[\n]+)(?:\s*\[([^\]]+)\])?/i);
        if (!segmentMatch?.[1] || !segmentMatch?.[2] || !segmentMatch?.[3]) continue;

        const [, type, duration, target, extras] = segmentMatch;

        const segment: WorkoutSegment = {
            type: type.trim(),
            duration: parseDuration(duration.trim()),
            target: target.trim()
        };

        // Parse optional extras (cadence and notes)
        if (extras) {
            const cadenceMatch = extras.match(/Cadence:\s*(\d+)/i);
            if (cadenceMatch?.[1]) {
                segment.cadence = parseInt(cadenceMatch[1]);
            }

            const notesMatch = extras.match(/Notes:\s*([^\]]+)/i);
            if (notesMatch?.[1]) {
                segment.notes = notesMatch[1].trim();
            }
        }

        segments.push(segment);
    }

    return segments;
}

// Generate ZWO XML content
function generateZwoContent(segments: WorkoutSegment[]): string {
    const workoutSegments = segments.map(segment => {
        const durationSeconds = segment.duration.unit === 'min'
            ? segment.duration.value * 60
            : segment.duration.value;

        const power = targetToZwiftPower(segment.target);

        const cadenceAttr = segment.cadence ? ` Cadence="${segment.cadence}"` : '';
        const showsTarget = segment.target.toLowerCase().includes('ftp') ? ' ShowsPower="1"' : '';

        return `        <SteadyState Duration="${durationSeconds}" Power="${power}"${cadenceAttr}${showsTarget}${segment.notes ? ` textEvent="${segment.notes}"` : ''}/>`
    }).join('\n');

    return `<workout_file>
    <author>Strava MCP Server</author>
    <name>Generated Workout</name>
    <description>Workout generated based on recent activities</description>
    <sportType>bike</sportType>
    <tags></tags>
    <workout>
${workoutSegments}
    </workout>
</workout_file>`;
}

const FormatWorkoutFileInputSchema = z.object({
    strava_athlete_id: z.string()
        .describe("The Strava athlete ID for authentication"),
    workoutText: z.string().describe("The workout plan text in the specified format"),
    format: z.enum(['zwo']).default('zwo').describe("Output format (currently only 'zwo' is supported)")
});

type FormatWorkoutFileInput = z.infer<typeof FormatWorkoutFileInputSchema>;

export const makeTool = (stravaAuthRepository: StravaAuthRepository) => {
    return {
        name: "format-workout-file",
        description: "Formats a workout plan into a structured file format (currently supports Zwift .zwo)",
        inputSchema: FormatWorkoutFileInputSchema,
        execute: makeExecuteFn(stravaAuthRepository)
    }
}

const makeExecuteFn = (_stravaAuthRepository: StravaAuthRepository) => {
    return async ({ strava_athlete_id: _strava_athlete_id, workoutText, format }: FormatWorkoutFileInput) => {
        // Note: This tool doesn't strictly need the token, but we keep the pattern consistent
        // and could potentially use it to fetch athlete zones in the future.
        // For now, we just check if the user exists/is authenticated if we wanted to enforce it,
        // but since it's a formatting tool, we might skip strict token check or just pass it through.
        // However, to be consistent with other tools, we can fetch the token or just proceed.
        // Given the prompt "Update all the mcp tools to the same implementation", I will include the repository pattern.

        // Optional: Verify user exists if needed, but for pure formatting it might be overkill.
        // But let's stick to the pattern.
        // const token = await stravaAuthRepository.fetchAccessToken(strava_athlete_id);
        // if (!token) return AUTH_ERROR_RESPONSE; 

        try {
            // Parse the workout text into structured segments
            const segments = parseWorkoutText(workoutText);

            if (segments.length === 0) {
                return generateErrorResponse("❌ No valid workout segments found in the input text. Please ensure the format matches the expected pattern.");
            }

            // Generate the appropriate format
            if (format === 'zwo') {
                const zwoContent = generateZwoContent(segments);
                return {
                    content: [{
                        type: "text",
                        text: zwoContent
                    }]
                };
            }

            // Should never reach here due to zod validation
            throw new Error(`Unsupported format: ${format}`);

        } catch (error) {
            return generateErrorResponse(`❌ Failed to format workout: ${(error as Error).message}`);
        }
    }
}