import pg from "pg";
import { randomUUID } from "node:crypto";
import { SCHEMA_SQL } from "./schema.js";

const { Pool } = pg;

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function runMigrations(): Promise<void> {
  await pool.query(SCHEMA_SQL);
}

function genId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

// Builds "col1 = $2, col2 = $3" from only the defined keys of `updates`,
// starting param numbering at `startIndex`. Shared by every repo's update().
function buildSetClause(updates: Record<string, unknown>, startIndex: number) {
  const keys = Object.keys(updates).filter((k) => updates[k] !== undefined);
  const setClause = keys.map((k, i) => `${k} = $${startIndex + i}`).join(", ");
  const values = keys.map((k) => updates[k]);
  return { setClause, values, keys };
}

export interface OrganizationInput {
  name: string;
  org_type: string;
  ownership_category?: string;
  sector?: string;
  state?: string;
  meter_count?: number;
  website?: string;
  notes?: string;
}

export const organizations = {
  async create(input: OrganizationInput) {
    const id = genId("org");
    const { rows } = await pool.query(
      `INSERT INTO organizations (id, name, org_type, ownership_category, sector, state, meter_count, website, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [id, input.name, input.org_type, input.ownership_category ?? null, input.sector ?? null, input.state ?? null, input.meter_count ?? null, input.website ?? null, input.notes ?? null]
    );
    return rows[0];
  },
  async update(id: string, updates: Partial<OrganizationInput>) {
    const { setClause, values } = buildSetClause(updates, 2);
    if (!setClause) return organizations.findById(id);
    const { rows } = await pool.query(`UPDATE organizations SET ${setClause} WHERE id = $1 RETURNING *`, [id, ...values]);
    return rows[0] ?? null;
  },
  async findById(id: string) {
    const { rows } = await pool.query(`SELECT * FROM organizations WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },
  async search(query: string, filters: { state?: string; org_type?: string; sector?: string } = {}) {
    const { rows } = await pool.query(
      `SELECT * FROM organizations
       WHERE name ILIKE $1
         AND ($2::text IS NULL OR state = $2)
         AND ($3::text IS NULL OR org_type = $3)
         AND ($4::text IS NULL OR sector = $4)
       ORDER BY name`,
      [`%${query}%`, filters.state ?? null, filters.org_type ?? null, filters.sector ?? null]
    );
    return rows;
  },
};

export interface ContactInput {
  name: string;
  title?: string;
  organization_id: string;
  role_category: string;
  decision_authority: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  is_current: boolean;
}

export const contacts = {
  async create(input: ContactInput) {
    const id = genId("contact");
    const { rows } = await pool.query(
      `INSERT INTO contacts (id, name, title, organization_id, role_category, decision_authority, email, phone, linkedin, is_current)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [id, input.name, input.title ?? null, input.organization_id, input.role_category, input.decision_authority, input.email ?? null, input.phone ?? null, input.linkedin ?? null, input.is_current]
    );
    return rows[0];
  },
  async update(id: string, updates: Partial<ContactInput>) {
    const { setClause, values } = buildSetClause(updates, 2);
    if (!setClause) return contacts.findById(id);
    const { rows } = await pool.query(`UPDATE contacts SET ${setClause} WHERE id = $1 RETURNING *`, [id, ...values]);
    return rows[0] ?? null;
  },
  async findById(id: string) {
    const { rows } = await pool.query(`SELECT * FROM contacts WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },
  async search(query: string, filters: { organization_id?: string; role_category?: string; is_current?: boolean } = {}) {
    const { rows } = await pool.query(
      `SELECT * FROM contacts
       WHERE (name ILIKE $1 OR email ILIKE $1)
         AND ($2::text IS NULL OR organization_id = $2)
         AND ($3::text IS NULL OR role_category = $3)
         AND ($4::boolean IS NULL OR is_current = $4)
       ORDER BY name`,
      [`%${query}%`, filters.organization_id ?? null, filters.role_category ?? null, filters.is_current ?? null]
    );
    return rows;
  },
  async addPositionHistory(input: { contact_id: string; organization_id: string; title: string; start_date?: string; end_date?: string }) {
    const id = genId("position");
    const { rows } = await pool.query(
      `INSERT INTO contact_position_history (id, contact_id, organization_id, title, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, input.contact_id, input.organization_id, input.title, input.start_date ?? null, input.end_date ?? null]
    );
    return rows[0];
  },
  async getProfile(contactId: string) {
    const contact = await contacts.findById(contactId);
    if (!contact) return null;
    const [positions, relationshipRows, interactionRows] = await Promise.all([
      pool.query(`SELECT * FROM contact_position_history WHERE contact_id = $1 ORDER BY start_date DESC NULLS LAST`, [contactId]),
      pool.query(
        `SELECT r.*, fc.name AS firm_colleague_name
         FROM relationships r
         JOIN firm_colleagues fc ON fc.id = r.firm_colleague_id
         WHERE r.contact_id = $1`,
        [contactId]
      ),
      pool.query(
        `SELECT i.* FROM interactions i
         JOIN relationships r ON r.id = i.relationship_id
         WHERE r.contact_id = $1
         ORDER BY i.date DESC
         LIMIT 20`,
        [contactId]
      ),
    ]);
    return {
      contact,
      position_history: positions.rows,
      relationships: relationshipRows.rows,
      recent_interactions: interactionRows.rows,
    };
  },
};

export const firmColleagues = {
  async create(input: { name: string; email: string; department?: string; role?: string }) {
    const id = genId("colleague");
    const { rows } = await pool.query(
      `INSERT INTO firm_colleagues (id, name, email, department, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, input.name, input.email, input.department ?? null, input.role ?? null]
    );
    return rows[0];
  },
};

export const relationships = {
  async create(input: { firm_colleague_id: string; contact_id: string; relationship_type: string; strength_score: number; notes?: string }) {
    const id = genId("rel");
    const { rows } = await pool.query(
      `INSERT INTO relationships (id, firm_colleague_id, contact_id, relationship_type, strength_score, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, input.firm_colleague_id, input.contact_id, input.relationship_type, input.strength_score, input.notes ?? null]
    );
    return rows[0];
  },
  async updateStrength(relationshipId: string, strengthScore: number) {
    const { rows } = await pool.query(`UPDATE relationships SET strength_score = $2 WHERE id = $1 RETURNING *`, [relationshipId, strengthScore]);
    return rows[0] ?? null;
  },
  async findById(id: string) {
    const { rows } = await pool.query(`SELECT * FROM relationships WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },
  async getMapForOrg(organizationId: string) {
    const { rows } = await pool.query(
      `SELECT
         c.id AS contact_id, c.name AS contact_name,
         r.id AS relationship_id, r.relationship_type, r.strength_score, r.last_interaction_at, r.notes AS relationship_notes,
         fc.id AS firm_colleague_id, fc.name AS firm_colleague_name
       FROM contacts c
       JOIN relationships r ON r.contact_id = c.id
       JOIN firm_colleagues fc ON fc.id = r.firm_colleague_id
       WHERE c.organization_id = $1`,
      [organizationId]
    );
    return rows;
  },
  async linkToOutcome(relationshipId: string, outcome: { outcome_type: string; outcome_value: string; revenue?: number }) {
    const existing = await relationships.findById(relationshipId);
    if (!existing) return null;
    const outcomeLine = `[outcome:${outcome.outcome_type}] ${outcome.outcome_value}${outcome.revenue ? ` ($${outcome.revenue})` : ""}`;
    const notes = existing.notes ? `${existing.notes}\n${outcomeLine}` : outcomeLine;
    const { rows } = await pool.query(`UPDATE relationships SET notes = $2 WHERE id = $1 RETURNING *`, [relationshipId, notes]);
    return rows[0];
  },
};

export const interactions = {
  async create(input: { relationship_id: string; interaction_type: string; date: string; summary: string; sentiment?: string; notes?: string }) {
    const id = genId("interaction");
    const { rows } = await pool.query(
      `INSERT INTO interactions (id, relationship_id, interaction_type, date, summary, sentiment, source, notes)
       VALUES ($1, $2, $3, $4, $5, $6, 'manual', $7) RETURNING *`,
      [id, input.relationship_id, input.interaction_type, input.date, input.summary, input.sentiment ?? null, input.notes ?? null]
    );
    await pool.query(`UPDATE relationships SET last_interaction_at = $2 WHERE id = $1`, [input.relationship_id, input.date]);
    return rows[0];
  },
  async findByRelationship(relationshipId: string) {
    const { rows } = await pool.query(`SELECT * FROM interactions WHERE relationship_id = $1 ORDER BY date DESC`, [relationshipId]);
    return rows;
  },
  async findRecent(filters: { relationship_id?: string; contact_id?: string; days?: number; limit?: number } = {}) {
    const days = filters.days ?? 90;
    const limit = filters.limit ?? 20;
    const { rows } = await pool.query(
      `SELECT i.* FROM interactions i
       JOIN relationships r ON r.id = i.relationship_id
       WHERE i.date >= now() - ($1 || ' days')::interval
         AND ($2::text IS NULL OR i.relationship_id = $2)
         AND ($3::text IS NULL OR r.contact_id = $3)
       ORDER BY i.date DESC
       LIMIT $4`,
      [String(days), filters.relationship_id ?? null, filters.contact_id ?? null, limit]
    );
    return rows;
  },
};
