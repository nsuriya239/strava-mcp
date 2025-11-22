import { StravaAccessInfo } from "../model/strava_access_model.js";
import type { StravaAccessInfoType, StravaAccessInfoCreateType } from "../model/strava_access_model.js";

export class StravaAuthRepository {

    async findById(userId: string): Promise<StravaAccessInfoType | null> {
        return StravaAccessInfo.findByPk(userId);
    }

    async create(data: StravaAccessInfoCreateType): Promise<StravaAccessInfoType | null> {
        console.log("StravaAuthRepository.create called with:", JSON.stringify(data));
        try {
            const authInfo = await StravaAccessInfo.create(data);
            return authInfo.toJSON() as StravaAccessInfoType
        } catch (error) {
            console.error("Error in StravaAuthRepository.create:", error);
            throw error;
        }
    }

    async update(userId: string, data: Partial<StravaAccessInfoType>): Promise<StravaAccessInfoType | null> {
        const authInfo = await StravaAccessInfo.findByPk(userId);
        if (!authInfo)
            return null
        await authInfo.update(data);
        return authInfo.toJSON() as StravaAccessInfoType
    }

    async upsert(userId: string, data: Partial<StravaAccessInfoType>): Promise<StravaAccessInfoType | null> {
        try {
            const existing = await StravaAccessInfo.findByPk(userId);
            if (existing) {
                // Update existing record with provided fields
                await existing.update(data);
                return existing.toJSON() as StravaAccessInfoType;
            }
            // Create new record ensuring required fields are present
            const newRecord = await StravaAccessInfo.create({
                userId,
                accessToken: data.accessToken as string,
                refreshToken: data.refreshToken as string,
                expiresAt: data.expiresAt as Date,
            });
            return newRecord.toJSON() as StravaAccessInfoType;
        } catch (error) {
            console.error("Error in StravaAuthRepository.upsert:", error);
            throw error;
        }
    }

    async fetchAccessToken(userId: string): Promise<string | null> {
        const authInfo = await StravaAccessInfo.findByPk(userId);
        if (!authInfo)
            return null
        return authInfo.accessToken
    }

}
