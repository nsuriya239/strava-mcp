import { Sequelize, Model, InferAttributes, InferCreationAttributes, DataTypes } from "sequelize";

export class StravaAccessInfo extends Model<InferAttributes<StravaAccessInfo>, InferCreationAttributes<StravaAccessInfo>> {

    declare userId: string;
    declare accessToken: string;
    declare refreshToken: string;
    declare expiresAt: Date;

    static initModel(db: Sequelize) {
        StravaAccessInfo.init({
            userId: {
                type: DataTypes.STRING,
                allowNull: false,
                primaryKey: true
            },
            accessToken: {
                type: DataTypes.STRING,
                allowNull: false
            },
            refreshToken: {
                type: DataTypes.STRING,
                allowNull: false
            },
            expiresAt: {
                type: DataTypes.DATE,
                allowNull: false,
            }
        },
            { sequelize: db, tableName: 'strava_access_info' }
        );
    }
    static associate(_models: any) {

    }
}

export type StravaAccessInfoType = InferAttributes<StravaAccessInfo>;
export type StravaAccessInfoCreateType = InferCreationAttributes<StravaAccessInfo>;