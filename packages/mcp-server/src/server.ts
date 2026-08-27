import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { tools } from "./tools/index.js";

export function createServer(): McpServer {
  const server = new McpServer({ name: "relationship-intel", version: "0.1.0" });

  for (const [name, tool] of Object.entries(tools)) {
    // Iterating a union of 15 differently-shaped Zod input schemas defeats
    // registerTool's generic inference (TS2589: excessively deep). The cast
    // is a compiler workaround, not a runtime safety loss - Zod still
    // validates each call against its real inputSchema at request time.
    const config = { description: tool.description, inputSchema: tool.inputSchema } as any;
    server.registerTool(name, config, tool.handler as any);
  }

  return server;
}
