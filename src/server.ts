import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { registerTools } from "./mcp/tools.js";


// Load .env file explicitly from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');
// REMOVE THIS DEBUG LOG - Interferes with MCP Stdio transport
// console.log(`[DEBUG] Attempting to load .env file from: ${envPath}`);
dotenv.config({ path: envPath });

const server = new McpServer({
  name: "Strava MCP Server",
  version: "1.0.0"
});

registerTools(server);


// --- Server Startup ---
async function startServer() {
  try {
    console.error("Starting Strava MCP Server...");
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`Strava MCP Server connected via Stdio. Tools registered.`);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();