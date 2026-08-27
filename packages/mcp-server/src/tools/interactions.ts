import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as db from '@rel-intel/db';
import { LogInteractionInput } from '@rel-intel/core';

const DEFAULT_COLLEAGUE_ID = 'colleague-placeholder';

export async function register(server: McpServer) {
  await server.tool('log_interaction', 'Log an interaction with a contact', { type: 'object', properties: {} }, async (input: any) => {
    try {
      const validated = LogInteractionInput.parse(input);
      
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
      const occurredAt = validated.occurred_at ? new Date(validated.occurred_at) : new Date();

      let relationshipId: string | undefined;
      const rel = await db.relationshipRepo.getRelationshipByColleagueAndContact(colleagueId, contactId);
      if (!rel) {
        const newRel = await db.relationshipRepo.createRelationship({
          firm_colleague_id: colleagueId,
          contact_id: contactId,
        });
        relationshipId = newRel.id;
      } else {
        relationshipId = rel.id;
      }

      const interaction = await db.interactionRepo.createInteraction({
        relationship_id: relationshipId,
        contact_id: contactId,
        firm_colleague_id: colleagueId,
        interaction_type: validated.interaction_type,
        occurred_at: occurredAt,
        summary: validated.summary,
        sentiment: validated.sentiment,
        source: 'manual',
      });

      await db.relationshipRepo.updateRelationshipLastInteraction(relationshipId);

      return { success: true, interaction, message: 'Interaction logged' };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  await server.tool('get_recent_interactions', 'Get recent interactions', { type: 'object', properties: { days_back: { type: 'number' }, colleague_id: { type: 'string' } } }, async (input: any) => {
    try {
      const daysBack = input.days_back || 30;
      const colleagueId = input.colleague_id;
      const interactions = await db.interactionRepo.getRecentInteractions(daysBack, colleagueId, 100);
      return { success: true, interactions };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
}
