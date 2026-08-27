import { query, queryOne } from '../client.js';

export interface Interaction {
  id: string;
  relationship_id?: string | null;
  contact_id: string;
  firm_colleague_id: string;
  interaction_type: string;
  occurred_at: Date;
  summary: string;
  sentiment?: string | null;
  source: string;
  created_at: Date;
}

export async function createInteraction(data: {
  relationship_id?: string;
  contact_id: string;
  firm_colleague_id: string;
  interaction_type: string;
  occurred_at: Date;
  summary: string;
  sentiment?: string;
  source?: string;
}): Promise<Interaction> {
  const result = await queryOne<Interaction>(
    `INSERT INTO interactions (relationship_id, contact_id, firm_colleague_id, interaction_type, occurred_at, summary, sentiment, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [data.relationship_id, data.contact_id, data.firm_colleague_id, data.interaction_type, data.occurred_at, data.summary, data.sentiment, data.source || 'manual']
  );
  return result!;
}

export async function getRecentInteractions(daysBack = 30, colleagueId?: string, limit = 100): Promise<Interaction[]> {
  if (colleagueId) {
    return query<Interaction>(
      `SELECT * FROM interactions 
       WHERE firm_colleague_id = $1 AND occurred_at >= CURRENT_TIMESTAMP - INTERVAL '1 day' * $2
       ORDER BY occurred_at DESC LIMIT $3`,
      [colleagueId, daysBack, limit]
    );
  }
  return query<Interaction>(
    `SELECT * FROM interactions 
     WHERE occurred_at >= CURRENT_TIMESTAMP - INTERVAL '1 day' * $1
     ORDER BY occurred_at DESC LIMIT $2`,
    [daysBack, limit]
  );
}

export async function getInteractionsForContact(contactId: string): Promise<Interaction[]> {
  return query<Interaction>(
    `SELECT * FROM interactions WHERE contact_id = $1 ORDER BY occurred_at DESC`,
    [contactId]
  );
}
