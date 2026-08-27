import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as organizationTools from './organizations.js';
import * as contactTools from './contacts.js';
import * as relationshipTools from './relationships.js';
import * as interactionTools from './interactions.js';

export async function registerTools(server: McpServer) {
  await organizationTools.register(server);
  await contactTools.register(server);
  await relationshipTools.register(server);
  await interactionTools.register(server);
}
