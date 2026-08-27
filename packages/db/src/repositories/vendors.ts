import { query, queryOne } from '../client.js';

export interface Vendor {
  id: string;
  name: string;
  vendor_type?: string | null;
  specializations?: string | null;
  website?: string | null;
  headquarters_location?: string | null;
  annual_revenue?: number | null;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function createVendor(data: {
  name: string;
  vendor_type?: string;
  specializations?: string;
  website?: string;
  headquarters_location?: string;
  annual_revenue?: number;
  notes?: string;
}): Promise<Vendor> {
  const result = await queryOne<Vendor>(
    `INSERT INTO vendors (name, vendor_type, specializations, website, headquarters_location, annual_revenue, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [data.name, data.vendor_type, data.specializations, data.website, data.headquarters_location, data.annual_revenue, data.notes]
  );
  return result!;
}

export async function getVendor(id: string): Promise<Vendor | null> {
  return queryOne<Vendor>('SELECT * FROM vendors WHERE id = $1', [id]);
}

export async function searchVendors(searchTerm: string, limit = 50): Promise<Vendor[]> {
  return query<Vendor>(
    `SELECT * FROM vendors 
     WHERE to_tsvector('english', name) @@ plainto_tsquery('english', $1)
     ORDER BY name
     LIMIT $2`,
    [searchTerm, limit]
  );
}
