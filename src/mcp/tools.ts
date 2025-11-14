import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Import all tool definitions with the correct names
import { getAthleteProfile } from '../tools/getAthleteProfile.js';
import { getAthleteStatsTool } from '../tools/getAthleteStats.js';
import { getActivityDetailsTool } from '../tools/getActivityDetails.js';
import { getRecentActivities } from '../tools/getRecentActivities.js';
import { listAthleteClubs } from '../tools/listAthleteClubs.js';
import { listStarredSegments } from '../tools/listStarredSegments.js';
import { getSegmentTool } from '../tools/getSegment.js';
import { exploreSegments } from '../tools/exploreSegments.js';
import { starSegment } from '../tools/starSegment.js';
import { getSegmentEffortTool } from '../tools/getSegmentEffort.js';
import { listSegmentEffortsTool } from '../tools/listSegmentEfforts.js';
import { listAthleteRoutesTool } from '../tools/listAthleteRoutes.js';
import { getRouteTool } from '../tools/getRoute.js';
import { exportRouteGpx } from '../tools/exportRouteGpx.js';
import { exportRouteTcx } from '../tools/exportRouteTcx.js';
import { getActivityStreamsTool } from '../tools/getActivityStreams.js';
import { getActivityLapsTool } from '../tools/getActivityLaps.js';
import { getAthleteZonesTool } from '../tools/getAthleteZones.js';
import { getAllActivities } from '../tools/getAllActivities.js';


export const registerTools = (server: McpServer) => {
    // Register all tools using server.tool and the correct imported objects
    server.tool(
        getAthleteProfile.name,
        getAthleteProfile.description,
        {},
        getAthleteProfile.execute
    );
    server.tool(
        getAthleteStatsTool.name,
        getAthleteStatsTool.description,
        getAthleteStatsTool.inputSchema?.shape ?? {},
        getAthleteStatsTool.execute
    );
    server.tool(
        getActivityDetailsTool.name,
        getActivityDetailsTool.description,
        getActivityDetailsTool.inputSchema?.shape ?? {},
        getActivityDetailsTool.execute
    );
    server.tool(
        getRecentActivities.name,
        getRecentActivities.description,
        getRecentActivities.inputSchema?.shape ?? {},
        getRecentActivities.execute
    );
    server.tool(
        listAthleteClubs.name,
        listAthleteClubs.description,
        {},
        listAthleteClubs.execute
    );
    server.tool(
        listStarredSegments.name,
        listStarredSegments.description,
        {},
        listStarredSegments.execute
    );
    server.tool(
        getSegmentTool.name,
        getSegmentTool.description,
        getSegmentTool.inputSchema?.shape ?? {},
        getSegmentTool.execute
    );
    server.tool(
        exploreSegments.name,
        exploreSegments.description,
        exploreSegments.inputSchema?.shape ?? {},
        exploreSegments.execute
    );
    server.tool(
        starSegment.name,
        starSegment.description,
        starSegment.inputSchema?.shape ?? {},
        starSegment.execute
    );
    server.tool(
        getSegmentEffortTool.name,
        getSegmentEffortTool.description,
        getSegmentEffortTool.inputSchema?.shape ?? {},
        getSegmentEffortTool.execute
    );
    server.tool(
        listSegmentEffortsTool.name,
        listSegmentEffortsTool.description,
        listSegmentEffortsTool.inputSchema?.shape ?? {},
        listSegmentEffortsTool.execute
    );
    server.tool(
        listAthleteRoutesTool.name,
        listAthleteRoutesTool.description,
        listAthleteRoutesTool.inputSchema?.shape ?? {},
        listAthleteRoutesTool.execute
    );
    server.tool(
        getRouteTool.name,
        getRouteTool.description,
        getRouteTool.inputSchema?.shape ?? {},
        getRouteTool.execute
    );
    server.tool(
        exportRouteGpx.name,
        exportRouteGpx.description,
        exportRouteGpx.inputSchema?.shape ?? {},
        exportRouteGpx.execute
    );
    server.tool(
        exportRouteTcx.name,
        exportRouteTcx.description,
        exportRouteTcx.inputSchema?.shape ?? {},
        exportRouteTcx.execute
    );
    server.tool(
        getActivityStreamsTool.name,
        getActivityStreamsTool.description,
        getActivityStreamsTool.inputSchema?.shape ?? {},
        getActivityStreamsTool.execute
    );

    // --- Register get-activity-laps tool (Simplified) ---
    server.tool(
        getActivityLapsTool.name,
        getActivityLapsTool.description,
        getActivityLapsTool.inputSchema?.shape ?? {},
        getActivityLapsTool.execute
    );

    // --- Register get-athlete-zones tool ---
    server.tool(
        getAthleteZonesTool.name,
        getAthleteZonesTool.description,
        getAthleteZonesTool.inputSchema?.shape ?? {},
        getAthleteZonesTool.execute
    );

    // --- Register get-all-activities tool ---
    server.tool(
        getAllActivities.name,
        getAllActivities.description,
        getAllActivities.inputSchema?.shape ?? {},
        getAllActivities.execute
    );
}