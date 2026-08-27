import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as db from '@rel-intel/db';
import { CreateContactInput } from '@rel-intel/core';

export async function register(server: McpServer) {
  await server.tool('create_contact', 'Create a new contact', { type: 'object', properties: {} }, async (input: any) => {
    try {
      const validated = CreateContactInput.parse(input);
      
      let orgId = validated.organization_id;
      if (!orgId && validated.organization_name) {
        const orgs = await db.organizationRepo.searchOrganizations(validated.organization_name, 1);
        if (orgs.length === 0) {
          return { success: false, error: 'Organization not found. Please create it first with create_organization.' };
        }
        orgId = orgs[0].id;
      }

      if (!orgId) {
        return { success: false, error: 'organization_id or organization_name required' };
      }

      const contact = await db.contactRepo.createContact({
        organization_id: orgId,
        full_name: validated.full_name,
        title: validated.title,
        role_category: validated.role_category,
        decision_authority: validated.decision_authority,
        email: validated.email,
        phone: validated.phone,
        linkedin_url: validated.linkedin_url,
        notes: validated.notes,
      });

      return { success: true, contact, message: 'Contact created' };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  await server.tool('search_contacts', 'Search for contacts', { type: 'object', properties: { query: { type: 'string' } } }, async (input: any) => {
    try {
      const contacts = await db.contactRepo.searchContacts(input.query, 50);
      return { success: true, contacts };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  await server.tool('get_contact', 'Get a specific contact', { type: 'object', properties: { contact_id: { type: 'string' } } }, async (input: any) => {
    try {
      return await db.contactRepo.getContact(input.contact_id);
    } catch (error) {
      return null;
    }
  });
}
