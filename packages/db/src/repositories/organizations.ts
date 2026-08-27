import { query, queryOne, execute } from '../client.js';

export interface Organization {
  id: string;
  name: string;
  org_type: string;
  ownership_category?: string | null;
  state?: string | null;
  meter_count?: number | null;
  total_revenue?: number | null;
  website?: string | null;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function createOrganization(data: {
  name: string;
  org_type: string;
  ownership_category?: string;
  state?: string;
  meter_count?: number;
  total_revenue?: number;
  website?: string;
  notes?: string;
}): Promise<Organization> {
  const result = await queryOne<Organization>(
    `INSERT INTO organizations (name, org_type, ownership_category, state, meter_count, total_revenue, website, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [data.name, data.org_type, data.ownership_category, data.state, data.meter_count, data.total_revenue, data.website, data.notes]
  );
  return result!;
}

export async function getOrganization(id: string): Promise<Organization | null> {
  return queryOne<Organization>('SELECT * FROM organizations WHERE id = $1', [id]);
}

export async function searchOrganizations(searchTerm: string, limit = 50): Promise<Organization[]> {
  return query<Organization>(
    `SELECT * FROM organizations 
     WHERE to_tsvector('english', name) @@ plainto_tsquery('english', $1)
     ORDER BY name
     LIMIT $2`,
    [searchTerm, limit]
  );
}

export async function updateOrganization(id: string, data: Partial<Organization>): Promise<Organization> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramNum = 1;

  if (data.name !== undefined) {
    updates.push(`name = $${paramNum++}`);
    values.push(data.name);
  }
  if (data.org_type !== undefined) {
    updates.push(`org_type = $${paramNum++}`);
    values.push(data.org_type);
  }
  if (data.ownership_category !== undefined) {
    updates.push(`ownership_category = $${paramNum++}`);
    values.push(data.ownership_category);
  }
  if (data.state !== undefined) {
    updates.push(`state = $${paramNum++}`);
    values.push(data.state);
  }
  if (data.meter_count !== undefined) {
    updates.push(`meter_count = $${paramNum++}`);
    values.push(data.meter_count);
  }
  if (data.total_revenue !== undefined) {
    updates.push(`total_revenue = $${paramNum++}`);
    values.push(data.total_revenue);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await queryOne<Organization>(
    `UPDATE organizations SET ${updates.join(', ')} WHERE id = $${paramNum} RETURNING *`,
    values
  );
  return result!;
}
