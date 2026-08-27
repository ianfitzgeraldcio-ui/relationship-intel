import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as db from '@rel-intel/db';
import { CreateRelationshipInput, UpdateRelationshipStrengthInput } from '@rel-intel/core';

const DEFAULT_COLLEAGUE_ID = 'colleague-placeholder';

export async function register(server: McpServer) {
  await server.tool('create_relationship', 'Create a relationship between colleague and contact', { type: 'object', properties: {} }, async (input: any) => {
    try {
      const validated = CreateRelationshipInput.parse(input);
      
      let contactId = validated.contact_id;
      if (!contactId && validated.contact_name) {
        const contacts = await db.contactRepo.searchContacts(validated.contact_name, 1);
        if (contacts.length === 0) {
          return { success: false, error: 'Contact not found' };
        }
        contactId = contacts[0].id;
      }

      if (!contactId) {
        return { success: false, error: 'contact_id or contact_name required' };
      }

      const colleagueId = validated.firm_colleague_id || DEFAULT_COLLEAGUE_ID;

      const existing = await db.relationshipRepo.getRelationshipByColleagueAndContact(colleagueId, contactId);
      if (existing) {
        return { success: true, relationship: existing, is_new: false, message: 'Relationship already exists' };
      }

      const rel = await db.relationshipRepo.createRelationship({
        firm_colleague_id: colleagueId,
        contact_id: contactId,
        strength_score_manual: validated.strength_score,
        relationship_type: validated.relationship_type,
        notes: validated.notes,
      });

      return { success: true, relationship: rel, is_new: true, message: 'Relationship created' };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  await server.tool('update_relationship_strength', 'Update relationship strength score', { type: 'object', properties: {} }, async (input: any) => {
    try {
      const validated = UpdateRelationshipStrengthInput.parse(input);
      const rel = await db.relationshipRepo.updateRelationshipStrength(validated.relationship_id, validated.strength_score, validated.notes);
      return { success: true, relationship: rel };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  await server.tool('get_relationship_map_for_org', 'Get all contacts and relationships for an organization', { type: 'object', properties: { organization_id: { type: 'string' }, organization_name: { type: 'string' } } }, async (input: any) => {
    try {
      let orgId = input.organization_id;
      if (!orgId && input.organization_name) {
        const orgs = await db.organizationRepo.searchOrganizations(input.organization_name, 1);
        if (orgs.length === 0) {
          return { success: false, error: 'Organization not found' };
        }
        orgId = orgs[0].id;
      }

      if (!orgId) {
        return { success: false, error: 'organization_id or organization_name required' };
      }

      const map = await db.relationshipRepo.getRelationshipMapForOrganization(orgId);
      return { success: true, contacts: map };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
}
