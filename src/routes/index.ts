import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Express } from 'express';
import { mcpRoute } from "./mcp.js";
import { Config } from '../utils/config.js';
import { authCallbackRoute, authRoute } from "./auth.js";
import { healthCheckRoute } from "./health.js";
import { IRepository } from "../repository/index.js";

export const setupRoutes = (app: Express, server: McpServer, config: Config, repositories: IRepository) => {
    app.post('/mcp', mcpRoute(server));
    app.get('/health', healthCheckRoute());
    app.get('/auth', authRoute(config));
    app.get('/callback', authCallbackRoute(config, repositories.stravaAuthRepository));
};