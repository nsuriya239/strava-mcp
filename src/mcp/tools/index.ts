import { StravaAuthRepository } from "../../repository/strava_auth_repository.js";
import { makeTool as makeGetAthleteProfileTool } from './getAthleteProfile.js';
// import { makeTool as makeGetAthleteStatsTool } from './getAthleteStats.js';
import { makeTool as makeGetActivityDetailsTool } from './getActivityDetails.js';
import { makeTool as makeGetRecentActivitiesTool } from './getRecentActivities.js';
import { makeTool as makeGetLastActivityTool } from './getLastActivity.js';
// import { makeTool as makeListAthleteClubsTool } from './listAthleteClubs.js';
// import { makeTool as makeListStarredSegmentsTool } from './listStarredSegments.js';
// import { makeTool as makeGetSegmentTool } from './getSegment.js';
// import { makeTool as makeExploreSegmentsTool } from './exploreSegments.js';
// import { makeTool as makeStarSegmentTool } from './starSegment.js';
// import { makeTool as makeGetSegmentEffortTool } from './getSegmentEffort.js';
// import { makeTool as makeListSegmentEffortsTool } from './listSegmentEfforts.js';
// import { makeTool as makeListAthleteRoutesTool } from './listAthleteRoutes.js';
// import { makeTool as makeGetRouteTool } from './getRoute.js';
// import { makeTool as makeExportRouteGpxTool } from './exportRouteGpx.js';
// import { makeTool as makeExportRouteTcxTool } from './exportRouteTcx.js';
// import { makeTool as makeGetActivityStreamsTool } from './getActivityStreams.js';
// import { makeTool as makeGetActivityLapsTool } from './getActivityLaps.js';
// import { makeTool as makeGetAthleteZonesTool } from './getAthleteZones.js';
import { makeTool as makeGetAllActivitiesTool } from './getAllActivities.js';
// import { makeTool as makeFormatWorkoutFileTool } from './formatWorkoutFile.js';
import { makeTool as makeStravaAuthTool } from './stravaAuth.js';
import { Config } from "../../utils/config.js";

import { Tool } from "../types.js";

export const makeTools = (stravaAuthRepository: StravaAuthRepository, config: Config): Tool[] => {
    return [
        makeGetAthleteProfileTool(stravaAuthRepository),
        // makeGetAthleteStatsTool(stravaAuthRepository),
        makeGetActivityDetailsTool(stravaAuthRepository),
        makeGetRecentActivitiesTool(stravaAuthRepository),
        makeGetLastActivityTool(stravaAuthRepository),
        // makeListAthleteClubsTool(stravaAuthRepository),
        // makeListStarredSegmentsTool(stravaAuthRepository),
        // makeGetSegmentTool(stravaAuthRepository),
        // makeExploreSegmentsTool(stravaAuthRepository),
        // makeStarSegmentTool(stravaAuthRepository),
        // makeGetSegmentEffortTool(stravaAuthRepository),
        // makeListSegmentEffortsTool(stravaAuthRepository),
        // makeListAthleteRoutesTool(stravaAuthRepository),
        // makeGetRouteTool(stravaAuthRepository),
        // makeExportRouteGpxTool(stravaAuthRepository),
        // makeExportRouteTcxTool(stravaAuthRepository),
        // makeGetActivityStreamsTool(stravaAuthRepository),
        // makeGetActivityLapsTool(stravaAuthRepository),
        // makeGetAthleteZonesTool(stravaAuthRepository),
        makeGetAllActivitiesTool(stravaAuthRepository),
        // makeFormatWorkoutFileTool(stravaAuthRepository),
        makeStravaAuthTool(config)
    ]
}