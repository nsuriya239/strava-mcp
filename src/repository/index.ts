import { ICacheClient } from "../client/cacheClient.js";
import { StravaAuthRepository } from "./strava_auth_repository.js";

export interface IRepository {
   stravaAuthRepository: StravaAuthRepository;
}

export const initializeRepositories = (cacheClient: ICacheClient) => {
   return {
      stravaAuthRepository: new StravaAuthRepository(cacheClient)
   }
}