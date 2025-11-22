import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createLogger } from '../utils/logger.js';
import { fileURLToPath } from 'url';
import {Request, Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

export const mcpRoute = (server: McpServer) => {
  return async (req: Request, res: Response) => {
    // In stateless mode, create a new transport for each request to prevent
    // request ID collisions. Different clients may use the same JSON-RPC request IDs,
    // which would cause responses to be routed to the wrong HTTP connections if
    // the transport state is shared.

    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });

      res.on("close", () => {
        transport.close();
      });

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      log.error(
        `Error handling MCP request: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
          },
          id: null,
        });
      }
    }
  };
};
