import { query, queryOne } from '../client.js';

export interface Relationship {
  id: string;
  firm_colleague_id: string;
  contact_id: string;
  strength_score_manual?: number | null;
  relationship_type?: string | null;
  last_interaction_at?: Date | null;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function createRelationship(data: {
  firm_colleague_id: string;
  contact_id: string;
  strength_score_manual?: number;
  relationship_type?: string;
  notes?: string;
}): Promise<Relationship> {
  const result = await queryOne<Relationship>(
    `INSERT INTO relationships (firm_colleague_id, contact_id, strength_score_manual, relationship_type, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.firm_colleague_id, data.contact_id, data.strength_score_manual, data.relationship_type, data.notes]
  );
  return result!;
}

export async function getRelationship(id: string): Promise<Relationship | null> {
  return queryOne<Relationship>('SELECT * FROM relationships WHERE id = $1', [id]);
}

export async function getRelationshipByColleagueAndContact(colleagueId: string, contactId: string): Promise<Relationship | null> {
  return queryOne<Relationship>(
    'SELECT * FROM relationships WHERE firm_colleague_id = $1 AND contact_id = $2',
    [colleagueId, contactId]
  );
}

export async function updateRelationshipStrength(id: string, score: number, notes?: string): Promise<Relationship> {
  const result = await queryOne<Relationship>(
    `UPDATE relationships SET strength_score_manual = $1, notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
    [score, notes, id]
  );
  return result!;
}

export async function updateRelationshipLastInteraction(id: string): Promise<void> {
  await queryOne<Relationship>(
    `UPDATE relationships SET last_interaction_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id`,
    [id]
  );
}

export async function getRelationshipMapForOrganization(orgId: string): Promise<any[]> {
  return query(
    `SELECT 
       r.id,
       r.contact_id,
       c.full_name,
       c.title,
       c.email,
       r.firm_colleague_id,
       fc.name as colleague_name,
       r.strength_score_manual,
       r.relationship_type,
       r.last_interaction_at,
       r.notes
     FROM contacts c
     LEFT JOIN relationships r ON c.id = r.contact_id
     LEFT JOIN firm_colleagues fc ON r.firm_colleague_id = fc.id
     WHERE c.organization_id = $1
     ORDER BY COALESCE(r.strength_score_manual, 0) DESC, r.last_interaction_at DESC NULLS LAST`,
    [orgId]
  );
}
