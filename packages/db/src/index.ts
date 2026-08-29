import pg from "pg";
import { randomUUID } from "node:crypto";
import { SCHEMA_SQL } from "./schema.js";
import { calculateEffectiveStrength } from "../../core/src/index.js";

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
  annual_revenue?: number;
  website?: string;
  notes?: string;
}

export const organizations = {
  async create(input: OrganizationInput) {
    const id = genId("org");
    const { rows } = await pool.query(
      `INSERT INTO organizations (id, name, org_type, ownership_category, sector, state, meter_count, annual_revenue, website, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [id, input.name, input.org_type, input.ownership_category ?? null, input.sector ?? null, input.state ?? null, input.meter_count ?? null, input.annual_revenue ?? null, input.website ?? null, input.notes ?? null]
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
  async search(query: string, filters: { state?: string; org_type?: string; sector?: string; min_revenue?: number } = {}) {
    const { rows } = await pool.query(
      `SELECT * FROM organizations
       WHERE name ILIKE $1
         AND ($2::text IS NULL OR state = $2)
         AND ($3::text IS NULL OR org_type = $3)
         AND ($4::text IS NULL OR sector = $4)
         AND ($5::bigint IS NULL OR annual_revenue >= $5)
       ORDER BY name`,
      [`%${query}%`, filters.state ?? null, filters.org_type ?? null, filters.sector ?? null, filters.min_revenue ?? null]
    );
    return rows;
  },
  async remove(id: string) {
    const { rows } = await pool.query(`DELETE FROM organizations WHERE id = $1 RETURNING *`, [id]);
    return rows[0] ?? null;
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
  async remove(id: string) {
    const { rows } = await pool.query(`DELETE FROM contacts WHERE id = $1 RETURNING *`, [id]);
    return rows[0] ?? null;
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
    const { rows: contactRows } = await pool.query(
      `SELECT c.*, o.name AS organization_name
       FROM contacts c
       JOIN organizations o ON o.id = c.organization_id
       WHERE c.id = $1`,
      [contactId]
    );
    const contact = contactRows[0];
    if (!contact) return null;
    const [positions, relationshipRows, interactionRows] = await Promise.all([
      pool.query(
        `SELECT p.*, o.name AS organization_name
         FROM contact_position_history p
         JOIN organizations o ON o.id = p.organization_id
         WHERE p.contact_id = $1
         ORDER BY p.start_date DESC NULLS LAST`,
        [contactId]
      ),
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
      relationships: withEffectiveStrength(relationshipRows.rows),
      recent_interactions: interactionRows.rows,
    };
  },
};

// Decorates relationship rows with a decay-adjusted effective_strength,
// using the previously-unused calculateEffectiveStrength from core.
function withEffectiveStrength<T extends { strength_score: number; last_interaction_at: string | null }>(rows: T[]) {
  return rows.map((r) => ({
    ...r,
    effective_strength: calculateEffectiveStrength(r.strength_score, r.last_interaction_at ?? undefined),
  }));
}

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
  async findAll() {
    const { rows } = await pool.query(`SELECT * FROM firm_colleagues ORDER BY name`);
    return rows;
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
  async updateTemperature(relationshipId: string, temperature: string) {
    const { rows } = await pool.query(
      `UPDATE relationships SET temperature = $2, temperature_updated_at = now() WHERE id = $1 RETURNING *`,
      [relationshipId, temperature]
    );
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
         r.id AS relationship_id, r.relationship_type, r.strength_score, r.temperature, r.last_interaction_at, r.notes AS relationship_notes,
         fc.id AS firm_colleague_id, fc.name AS firm_colleague_name
       FROM contacts c
       JOIN relationships r ON r.contact_id = c.id
       JOIN firm_colleagues fc ON fc.id = r.firm_colleague_id
       WHERE c.organization_id = $1`,
      [organizationId]
    );
    return withEffectiveStrength(rows);
  },
  // Flags relationships going quiet relative to their OWN historical
  // contact rhythm, not a fixed global window. Relationships with fewer
  // than 2 interactions fall back to a 60-day baseline.
  async findDrifting(multiplier: number = 2) {
    const { rows } = await pool.query(
      `WITH gaps AS (
         SELECT relationship_id, date - LAG(date) OVER (PARTITION BY relationship_id ORDER BY date) AS gap_days
         FROM interactions
       ),
       baselines AS (
         SELECT relationship_id, AVG(gap_days) AS avg_gap_days, COUNT(*) AS gap_count
         FROM gaps WHERE gap_days IS NOT NULL GROUP BY relationship_id
       )
       SELECT
         r.id AS relationship_id, c.id AS contact_id, c.name AS contact_name,
         r.strength_score, r.temperature, r.last_interaction_at,
         COALESCE(b.avg_gap_days, 60) AS baseline_gap_days,
         EXTRACT(DAY FROM now() - r.last_interaction_at) AS days_since_last_interaction
       FROM relationships r
       JOIN contacts c ON c.id = r.contact_id
       LEFT JOIN baselines b ON b.relationship_id = r.id
       WHERE r.last_interaction_at IS NOT NULL
         AND now() - r.last_interaction_at > (COALESCE(b.avg_gap_days, 60) * $1) * INTERVAL '1 day'
       ORDER BY days_since_last_interaction DESC`,
      [multiplier]
    );
    return rows;
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

export const contactConnections = {
  async create(input: { contact_id_a: string; contact_id_b: string; connection_type: string; referral_willingness?: string; notes?: string }) {
    const id = genId("conn");
    const { rows } = await pool.query(
      `INSERT INTO contact_connections (id, contact_id_a, contact_id_b, connection_type, referral_willingness, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, input.contact_id_a, input.contact_id_b, input.connection_type, input.referral_willingness ?? null, input.notes ?? null]
    );
    return rows[0];
  },
  async findForContact(contactId: string) {
    const { rows } = await pool.query(
      `SELECT cc.*,
         CASE WHEN cc.contact_id_a = $1 THEN cc.contact_id_b ELSE cc.contact_id_a END AS other_contact_id,
         CASE WHEN cc.contact_id_a = $1 THEN cb.name ELSE ca.name END AS other_contact_name
       FROM contact_connections cc
       JOIN contacts ca ON ca.id = cc.contact_id_a
       JOIN contacts cb ON cb.id = cc.contact_id_b
       WHERE cc.contact_id_a = $1 OR cc.contact_id_b = $1`,
      [contactId]
    );
    return rows;
  },
  // Which of the contacts I already have a relationship with are
  // connected to this target contact, and how willing they'd be to refer me.
  // One-hop only - not full graph pathfinding.
  async findWarmIntroPath(targetContactId: string) {
    const { rows } = await pool.query(
      `SELECT
         cc.id AS connection_id,
         ic.id AS intermediary_contact_id,
         ic.name AS intermediary_contact_name,
         cc.connection_type,
         cc.referral_willingness,
         r.id AS relationship_id,
         r.strength_score,
         r.temperature,
         fc.name AS firm_colleague_name
       FROM contact_connections cc
       JOIN contacts ic ON ic.id = (CASE WHEN cc.contact_id_a = $1 THEN cc.contact_id_b ELSE cc.contact_id_a END)
       JOIN relationships r ON r.contact_id = ic.id
       JOIN firm_colleagues fc ON fc.id = r.firm_colleague_id
       WHERE (cc.contact_id_a = $1 OR cc.contact_id_b = $1) AND ic.id <> $1
       ORDER BY
         CASE cc.referral_willingness
           WHEN 'confirmed' THEN 1 WHEN 'likely' THEN 2 WHEN 'possible' THEN 3
           WHEN 'unlikely' THEN 4 ELSE 5
         END,
         r.strength_score DESC`,
      [targetContactId]
    );
    return rows;
  },
};

export const opportunities = {
  async create(input: { organization_id: string; name: string; stage?: string; estimated_value?: number; probability?: number; expected_close_date?: string; notes?: string }) {
    const id = genId("opp");
    const { rows } = await pool.query(
      `INSERT INTO opportunities (id, organization_id, name, stage, estimated_value, probability, expected_close_date, notes)
       VALUES ($1, $2, $3, COALESCE($4, 'identified'), $5, $6, $7, $8) RETURNING *`,
      [id, input.organization_id, input.name, input.stage ?? null, input.estimated_value ?? null, input.probability ?? null, input.expected_close_date ?? null, input.notes ?? null]
    );
    return rows[0];
  },
  async update(id: string, updates: Partial<{ name: string; stage: string; estimated_value: number; probability: number; expected_close_date: string; actual_close_date: string; notes: string }>) {
    const { setClause, values } = buildSetClause(updates, 2);
    if (!setClause) return opportunities.findById(id);
    const { rows } = await pool.query(`UPDATE opportunities SET ${setClause} WHERE id = $1 RETURNING *`, [id, ...values]);
    return rows[0] ?? null;
  },
  async findById(id: string) {
    const { rows } = await pool.query(`SELECT * FROM opportunities WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },
  async remove(id: string) {
    const { rows } = await pool.query(`DELETE FROM opportunities WHERE id = $1 RETURNING *`, [id]);
    return rows[0] ?? null;
  },
  async search(filters: { organization_id?: string; stage?: string } = {}) {
    const { rows } = await pool.query(
      `SELECT o.*, org.name AS organization_name
       FROM opportunities o
       JOIN organizations org ON org.id = o.organization_id
       WHERE ($1::text IS NULL OR o.organization_id = $1)
         AND ($2::text IS NULL OR o.stage = $2)
       ORDER BY o.created_at DESC`,
      [filters.organization_id ?? null, filters.stage ?? null]
    );
    return rows;
  },
  async addContact(input: { opportunity_id: string; contact_id: string; contact_role?: string }) {
    const id = genId("oppcontact");
    const { rows } = await pool.query(
      `INSERT INTO opportunity_contacts (id, opportunity_id, contact_id, contact_role)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, input.opportunity_id, input.contact_id, input.contact_role ?? null]
    );
    return rows[0];
  },
  async getRevenueForecast(groupBy: "month" | "quarter" = "month") {
    const [pipeline, won] = await Promise.all([
      pool.query(
        `SELECT date_trunc($1, expected_close_date) AS period,
                SUM(estimated_value * COALESCE(probability, 0) / 100.0) AS weighted_value,
                COUNT(*) AS opportunity_count
         FROM opportunities
         WHERE stage NOT IN ('won', 'lost') AND expected_close_date IS NOT NULL
         GROUP BY period
         ORDER BY period`,
        [groupBy]
      ),
      pool.query(
        `SELECT COALESCE(SUM(estimated_value), 0) AS total_won_revenue, COUNT(*) AS won_count
         FROM opportunities WHERE stage = 'won'`
      ),
    ]);
    return { forecast_by_period: pipeline.rows, closed_won: won.rows[0] };
  },
};

export const reports = {
  async getRelationshipHealthSummary() {
    const [temperature, pipeline, drifting] = await Promise.all([
      pool.query(`SELECT COALESCE(temperature, 'unset') AS temperature, COUNT(*) AS count FROM relationships GROUP BY temperature`),
      pool.query(
        `SELECT stage, COUNT(*) AS count, COALESCE(SUM(estimated_value), 0) AS total_value
         FROM opportunities WHERE stage NOT IN ('won', 'lost') GROUP BY stage`
      ),
      relationships.findDrifting(2),
    ]);
    return {
      temperature_distribution: temperature.rows,
      open_pipeline_by_stage: pipeline.rows,
      drifting_relationship_count: drifting.length,
      drifting_relationships: drifting,
    };
  },
  async getOrganizationSummary(organizationId: string) {
    const [contactCount, relationshipCount, recentInteractionCount, openOpportunities, wonRevenue] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS count FROM contacts WHERE organization_id = $1`, [organizationId]),
      pool.query(
        `SELECT COUNT(*) AS count FROM relationships r JOIN contacts c ON c.id = r.contact_id WHERE c.organization_id = $1`,
        [organizationId]
      ),
      pool.query(
        `SELECT COUNT(*) AS count FROM interactions i
         JOIN relationships r ON r.id = i.relationship_id
         JOIN contacts c ON c.id = r.contact_id
         WHERE c.organization_id = $1 AND i.date >= now() - INTERVAL '90 days'`,
        [organizationId]
      ),
      pool.query(
        `SELECT * FROM opportunities WHERE organization_id = $1 AND stage NOT IN ('won', 'lost') ORDER BY created_at DESC`,
        [organizationId]
      ),
      pool.query(
        `SELECT COALESCE(SUM(estimated_value), 0) AS total FROM opportunities WHERE organization_id = $1 AND stage = 'won'`,
        [organizationId]
      ),
    ]);
    return {
      contact_count: Number(contactCount.rows[0].count),
      relationship_count: Number(relationshipCount.rows[0].count),
      interactions_last_90_days: Number(recentInteractionCount.rows[0].count),
      open_opportunities: openOpportunities.rows,
      won_revenue_to_date: wonRevenue.rows[0].total,
    };
  },
};
