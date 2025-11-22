import { StravaAuthRepository } from "./strava_auth_repository.js";

export interface IRepository {
   stravaAuthRepository: StravaAuthRepository;
}

export const initializeRepositories = () => {
   return {
      stravaAuthRepository: new StravaAuthRepository()
   }
}