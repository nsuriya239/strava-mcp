import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { IRepository } from "../repository/index.js";
import { makeTools } from "./tools/index.js"
import { createLogger } from "../utils/logger.js";
import { fileURLToPath } from "url";
import { Config } from "../utils/config.js";

const log = createLogger(fileURLToPath(import.meta.url));

export const registerTools = (server: McpServer, repositories: IRepository, config: Config) => {
    log.info("Registering MCP Tools ...");
    const { stravaAuthRepository } = repositories;

    const tools = makeTools(stravaAuthRepository, config);

    for (const tool of tools) {
        server.tool(
            tool.name,
            tool.description,
            (tool.inputSchema as any).shape,
            (tool as any).execute
        );
    }

    log.info("Registering MCP Tools ... done");
}