import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { tools } from "./tools/index.js";

export function createServer(): McpServer {
  const server = new McpServer({ name: "relationship-intel", version: "0.1.0" });

  for (const [name, tool] of Object.entries(tools)) {
    server.registerTool(name, { description: tool.description, inputSchema: tool.inputSchema }, tool.handler as any);
  }

  return server;
}
