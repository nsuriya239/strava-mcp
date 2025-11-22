import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { setupRoutes } from './routes/index.js';
import { Config } from './utils/config.js';
import { IRepository } from './repository/index.js';
import { createLogger } from './utils/logger.js';
import { fileURLToPath } from 'url';

const log = createLogger(fileURLToPath(import.meta.url));

export const setupAppServer = (server: McpServer, config: Config, repositories: IRepository) => {
  const app = express();
  app.use(express.json());

  log.info("Registering Routes ...");
  // Define your routes here
  setupRoutes(app, server, config, repositories);
  log.info("Registering Routes ... done");

  return app;
};


