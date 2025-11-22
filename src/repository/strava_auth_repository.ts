import { StravaAccessInfo } from "../model/strava_access_model.js";
import type { StravaAccessInfoType, StravaAccessInfoCreateType } from "../model/strava_access_model.js";

export class StravaAuthRepository {

    async findById(userId: string): Promise<StravaAccessInfoType | null> {
        return StravaAccessInfo.findByPk(userId);
    }

    async create(data: StravaAccessInfoCreateType): Promise<StravaAccessInfoType | null>{
        const authInfo = await StravaAccessInfo.create(data);
        return authInfo.toJSON() as StravaAccessInfoType
    }

    async update(userId: string, data: Partial<StravaAccessInfoType>): Promise<StravaAccessInfoType | null>{
        const authInfo = await StravaAccessInfo.findByPk(userId);
        if(!authInfo)
            return null
        await authInfo.update(data);
        return authInfo.toJSON() as StravaAccessInfoType
    }

    async upsert(userId: string, data: Partial<StravaAccessInfoType>): Promise<StravaAccessInfoType | null> {
        const authInfo = await StravaAccessInfo.findByPk(userId);
        if(!authInfo)
            return this.create(data as StravaAccessInfoCreateType);
        return this.update(userId, data);
    } 

}