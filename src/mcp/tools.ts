import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { IRepository } from "../repository/index.js";
import { makeTools } from "./tools/index.js"
import { createLogger } from "../utils/logger.js";
import { fileURLToPath } from "url";
import { Config } from "../utils/config.js";
import { Tool } from "./types.js";

const log = createLogger(fileURLToPath(import.meta.url));

export const registerTools = (server: McpServer, repositories: IRepository, config: Config) => {
    log.info("Registering MCP Tools ...");
    const { stravaAuthRepository } = repositories;

    const tools: Tool[] = makeTools(stravaAuthRepository, config);

    for (const tool of tools) {
        server.registerTool(
            tool.name,
            {
                description: tool.description,
                inputSchema: tool.inputSchema,
                outputSchema: tool.outputSchema,
            },
            tool.execute
        );
    }

    log.info("Registering MCP Tools ... done");
}