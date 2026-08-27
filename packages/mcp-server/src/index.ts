import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { runMigrations } from "../../db/src/index.js";
import { createServer } from "./server.js";
import { isAuthorized } from "./auth.js";
import { tools } from "./tools/index.js";

async function main() {
  console.log("Relationship Intelligence MCP Server v0.1.0");

  try {
    await runMigrations();
    console.log("Database schema is up to date");
  } catch (err) {
    console.error("Failed to run database migrations:", err);
    process.exit(1);
  }

  const app = express();
  app.use(express.json());

  app.get("/healthz", (_req, res) => {
    res.status(200).send("ok");
  });

  app.post("/mcp", async (req, res) => {
    if (!isAuthorized(req)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const server = createServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => {
      transport.close();
      server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error("Error handling MCP request:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    console.log(`MCP server listening on port ${port}`);
    console.log(`Registered tools (${Object.keys(tools).length}): ${Object.keys(tools).join(", ")}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
