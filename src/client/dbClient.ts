import { Sequelize } from "sequelize";
import { Config } from "../utils/config.js";
import { fileURLToPath } from "url";
import { createLogger } from "../utils/logger.js";
import { loadModels, ModelRegistry } from "../model/index.js";

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

export interface IDatabase {
  sequelize: Sequelize;
  models: ModelRegistry;
  close: () => void;
}

export const initializeDbClient = async (config: Config) => {
  log.info(`Initializing DB client`);
  const databaseUrl = generateDbUrl(config);
  log.debug(`DB URL :: ${databaseUrl}`);
  const dbClient = generateDBClient(databaseUrl);
  const db: IDatabase = {
    sequelize: dbClient,
    models: await loadModels(dbClient),
    close: () => {
      dbClient.close();
    },
  };
  db.sequelize.sync().then(() => {
    log.info(`Database & tables created!`);
  }).catch((err) => {
    log.error(`DB Sync error: ${err}`);
  });
  db.sequelize.authenticate().then(() => {
    log.info(`DB Connection Authenticated`);
  }).catch((err) => {
    log.error(`DB Connection error: ${err}`);
  });
  log.info(`DB Initialized successfully`);
  return db;
};

const generateDBClient = (databaseUrl: string) => {
  return new Sequelize(databaseUrl, {
    logging: false,
    dialect: "postgres",
    define: {
      charset: "utf8mb4",
      collate: "utf8mb4_general_ci",
      underscored: false,
      freezeTableName: true,
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Supabase requires this
      },
      family: 4,
    },
    pool: {
      //explain this line of code? this means that the connection pool will have a minimum of 0 connections and a maximum of 5 connections
      min: 0,
      max: 5,
    },
    logQueryParameters: process.env.NODE_ENV === "development", // this line of code will log the query parameters if the environment is development
    benchmark: true,
  });
};

const generateDbUrl = (config: Config): string => {
  const dbUrl = config?.dbConnectionString
  const user = config.dbUser;
  const password = config.dbPass;
  const host = config.dbHost;
  const port = config.dbPort ? `:${config.dbPort}` : "";
  const database = config.dbName;

  if (dbUrl) {
    return dbUrl;
  }
  // encode user/password/database to handle special characters safely
  const enc = encodeURIComponent;
  return `postgresql://${enc(user)}:${enc(password)}@${host}${port}/${enc(
    database
  )}`;
};
