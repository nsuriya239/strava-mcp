import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { setupRoutes } from './routes/index.js';
import { Config } from './utils/config.js';



export const setupAppServer = (server: McpServer, config: Config) => {
  const app = express();
  app.use(express.json());

  // Define your routes here
  setupRoutes(app, server, config);

  return app;
};


