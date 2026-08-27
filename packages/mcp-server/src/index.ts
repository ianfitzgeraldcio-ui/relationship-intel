import { Server } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import express from "express";
import { z } from "zod";
import {
  createOrganization,
  updateOrganization,
  searchOrganizations,
  createContact,
  updateContact,
  addContactPositionHistory,
  searchContacts,
  createFirmColleague,
  createRelationship,
  updateRelationshipStrength,
  logInteraction,
  getRelationshipMapForOrg,
  getContactProfile,
  listRecentInteractions,
  linkRelationshipToOutcome,
} from "./tools/index.js";

const server = new Server({
  name: "relationship-intel",
  version: "0.1.0",
});

// Register all tools
server.tool("create_organization", createOrganization.schema, createOrganization.handler);
server.tool("update_organization", updateOrganization.schema, updateOrganization.handler);
server.tool("search_organizations", searchOrganizations.schema, searchOrganizations.handler);
server.tool("create_contact", createContact.schema, createContact.handler);
server.tool("update_contact", updateContact.schema, updateContact.handler);
server.tool("add_contact_position_history", addContactPositionHistory.schema, addContactPositionHistory.handler);
server.tool("search_contacts", searchContacts.schema, searchContacts.handler);
server.tool("create_firm_colleague", createFirmColleague.schema, createFirmColleague.handler);
server.tool("create_relationship", createRelationship.schema, createRelationship.handler);
server.tool("update_relationship_strength", updateRelationshipStrength.schema, updateRelationshipStrength.handler);
server.tool("log_interaction", logInteraction.schema, logInteraction.handler);
server.tool("get_relationship_map_for_org", getRelationshipMapForOrg.schema, getRelationshipMapForOrg.handler);
server.tool("get_contact_profile", getContactProfile.schema, getContactProfile.handler);
server.tool("list_recent_interactions", listRecentInteractions.schema, listRecentInteractions.handler);
server.tool("link_relationship_to_outcome", linkRelationshipToOutcome.schema, linkRelationshipToOutcome.handler);

// Check if running with Express (HTTP) or stdio
const isExpress = process.env.EXPRESS_MODE === "true" || process.argv.includes("--express");

if (isExpress) {
  const app = express();
  const PORT = process.env.PORT || 3000;

  createMcpExpressApp(server, app);

  app.listen(PORT, () => {
    console.log(`MCP server listening on port ${PORT}`);
  });
} else {
  // Stdio transport (default)
  const transport = new StdioServerTransport();
  server.connect(transport);
}
