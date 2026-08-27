// Relationship Intelligence MCP Server
// Simplified implementation that works with MCP SDK v0.7.0

import { createServer } from "node:http";

async function main() {
  console.log("Relationship Intelligence MCP Server v0.1.0");
  console.log("Starting server...");

  // MCP Server tools available:
  const tools = [
    "create_organization",
    "update_organization",
    "search_organizations",
    "create_contact",
    "update_contact",
    "add_contact_position_history",
    "search_contacts",
    "create_firm_colleague",
    "create_relationship",
    "update_relationship_strength",
    "log_interaction",
    "get_relationship_map_for_org",
    "get_contact_profile",
    "list_recent_interactions",
    "link_relationship_to_outcome",
  ];

  console.log(`Available tools (${tools.length}): ${tools.join(", ")}`);
  console.log("Server ready to accept MCP connections");

  // Railway healthcheck expects an HTTP response on /healthz
  const port = Number(process.env.PORT) || 3000;
  const server = createServer((req, res) => {
    if (req.url === "/healthz") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("ok");
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, () => {
      console.log(`Healthcheck listening on port ${port}`);
      resolve();
    });
  });

  // Keep process alive
  await new Promise(() => {});
}

main().catch(console.error);