import { ICacheClient } from "../client/cacheClient.js";
import { StravaAccessInfo } from "../model/strava_access_model.js";
import type { StravaAccessInfoType, StravaAccessInfoCreateType } from "../model/strava_access_model.js";
import { createLogger } from "../utils/logger.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

export class StravaAuthRepository {

    private cacheClient: ICacheClient;

    constructor(cacheClient: ICacheClient) {
        this.cacheClient = cacheClient;
    }

    async findById(userId: string): Promise<StravaAccessInfoType | null> {
        try {
            const cached = this.cacheClient.get(userId);
            if (cached) {
                return cached as StravaAccessInfoType;
            }
            const authInfo = await StravaAccessInfo.findByPk(userId);
            if (!authInfo)
                return null
            this.cacheClient.set(userId, authInfo.toJSON() as StravaAccessInfoType);
            return authInfo.toJSON() as StravaAccessInfoType
        } catch (error) {
            log.error("Error in StravaAuthRepository.findById:", error);
            throw error;
        }
    }

    async create(data: StravaAccessInfoCreateType): Promise<StravaAccessInfoType | null> {
        try {
            const authInfo = await StravaAccessInfo.create(data);
            this.cacheClient.set(authInfo.userId, authInfo.toJSON() as StravaAccessInfoType);
            return authInfo.toJSON() as StravaAccessInfoType
        } catch (error) {
            log.error("Error in StravaAuthRepository.create:", error);
            throw error;
        }
    }

    async update(userId: string, data: Partial<StravaAccessInfoType>): Promise<StravaAccessInfoType | null> {
        try {
            const authInfo = await StravaAccessInfo.findByPk(userId);
            if (!authInfo)
                return null
            await authInfo.update(data);
            this.cacheClient.set(userId, authInfo.toJSON() as StravaAccessInfoType);
            return authInfo.toJSON() as StravaAccessInfoType
        } catch (error) {
            log.error("Error in StravaAuthRepository.update:", error);
            throw error;
        }
    }

    async upsert(userId: string, data: Partial<StravaAccessInfoType>): Promise<StravaAccessInfoType | null> {
        try {
            const existing = await this.findById(userId);
            if (existing) {
                // Update existing record with provided fields
                await this.update(userId, data);
                return existing;
            }
            return await this.create({
                userId,
                accessToken: data.accessToken as string,
                refreshToken: data.refreshToken as string,
                expiresAt: data.expiresAt as Date,
            });
        } catch (error) {
            log.error("Error in StravaAuthRepository.upsert:", error);
            throw error;
        }
    }

    async fetchAccessToken(userId: string): Promise<string | null> {
        const authInfo = await this.findById(userId);
        if (!authInfo)
            return null
        return authInfo.accessToken
    }

}
