import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as db from '@rel-intel/db';
import { CreateOrganizationInput } from '@rel-intel/core';

export async function register(server: McpServer) {
  await server.tool('create_organization', 'Create a new organization', { type: 'object', properties: {} }, async (input: any) => {
    try {
      const validated = CreateOrganizationInput.parse(input);
      const org = await db.organizationRepo.createOrganization(validated);
      return { success: true, organization: org };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  await server.tool('search_organizations', 'Search for organizations by name', { type: 'object', properties: { query: { type: 'string' } } }, async (input: any) => {
    try {
      const orgs = await db.organizationRepo.searchOrganizations(input.query, 50);
      return { success: true, organizations: orgs };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  await server.tool('get_organization', 'Get a specific organization', { type: 'object', properties: { organization_id: { type: 'string' } } }, async (input: any) => {
    try {
      const org = await db.organizationRepo.getOrganization(input.organization_id);
      return org || { error: 'Organization not found' };
    } catch (error) {
      return { error: String(error) };
    }
  });
}
