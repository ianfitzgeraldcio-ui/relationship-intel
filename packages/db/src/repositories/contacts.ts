import { query, queryOne } from '../client.js';

export interface Contact {
  id: string;
  organization_id: string;
  full_name: string;
  title?: string | null;
  role_category?: string | null;
  decision_authority: string;
  email?: string | null;
  phone?: string | null;
  linkedin_url?: string | null;
  is_current: boolean;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function createContact(data: {
  organization_id: string;
  full_name: string;
  title?: string;
  role_category?: string;
  decision_authority?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  notes?: string;
}): Promise<Contact> {
  const result = await queryOne<Contact>(
    `INSERT INTO contacts (organization_id, full_name, title, role_category, decision_authority, email, phone, linkedin_url, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [data.organization_id, data.full_name, data.title, data.role_category, data.decision_authority || 'unknown', data.email, data.phone, data.linkedin_url, data.notes]
  );
  return result!;
}

export async function getContact(id: string): Promise<Contact | null> {
  return queryOne<Contact>('SELECT * FROM contacts WHERE id = $1', [id]);
}

export async function searchContacts(searchTerm: string, limit = 50): Promise<Contact[]> {
  return query<Contact>(
    `SELECT * FROM contacts 
     WHERE to_tsvector('english', full_name) @@ plainto_tsquery('english', $1)
     ORDER BY full_name
     LIMIT $2`,
    [searchTerm, limit]
  );
}

export async function getContactsByOrganization(orgId: string): Promise<Contact[]> {
  return query<Contact>(
    `SELECT * FROM contacts WHERE organization_id = $1 ORDER BY full_name`,
    [orgId]
  );
}
