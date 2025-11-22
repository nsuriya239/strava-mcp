import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { IRepository } from "../repository/index.js";
import { makeTools } from "./tools/index.js"

export const registerTools = (server: McpServer, repositories: IRepository) => {
    const { stravaAuthRepository } = repositories;

    const tools = makeTools(stravaAuthRepository);

    for (const tool of tools) {
        server.tool(
            tool.name,
            tool.description,
            (tool.inputSchema as any).shape,
            (tool as any).execute
        );
    }
}