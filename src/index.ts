import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "./mcp/tools.js";
import { setupAppServer } from "./server.js";
import { loadConfigFromEnv } from "./utils/config.js";
import { createLogger } from "./utils/logger.js";
import { fileURLToPath } from "url";
import { initializeDbClient } from "./client/dbClient.js";
import { initializeRepositories } from "./repository/index.js";

const __filename = fileURLToPath(import.meta.url);
const log = createLogger(__filename);

const mcpServer = new McpServer({
  name: "Strava MCP Server",
  version: "1.0.0"
});

// --- Server Startup ---
async function startServer() {
  try {
    log.info("Initializing Strava MCP Server...");
    log.info("Registering MCP Tools ...");
    const config = loadConfigFromEnv();
    initializeDbClient(config);
    const repositories = initializeRepositories();
    registerTools(mcpServer, repositories);
    log.info("Starting Strava MCP App Server...");
    const app = setupAppServer(mcpServer, config);
    app.listen(config.PORT, () => {
      log.info(`Strava MCP Server running on http://localhost:${config.PORT}/mcp`);
    }).on('error', error => {
      log.error(`Server error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    });

    log.info(`Strava MCP Server connected via StreamableHttp.`);
  } catch (error) {
    log.error(`Failed to start server: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

startServer();