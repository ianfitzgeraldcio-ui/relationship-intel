// Idempotent schema, applied on every boot. Kept as a TS string (not a
// .sql asset) because tsc does not copy non-.ts files into dist/, and a
// missing-asset-at-runtime bug is exactly what broke this deployment twice
// already.
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  org_type TEXT NOT NULL CHECK (org_type IN ('utility', 'regulator', 'rto_iso', 'firm', 'other')),
  ownership_category TEXT CHECK (ownership_category IN ('IOU', 'Cooperative', 'Municipal', 'PUD')),
  state TEXT,
  meter_count INTEGER,
  website TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  role_category TEXT NOT NULL CHECK (role_category IN ('executive', 'regulatory_affairs', 'board_member', 'procurement', 'technical', 'other')),
  decision_authority TEXT NOT NULL CHECK (decision_authority IN ('decision_maker', 'influencer', 'gatekeeper', 'unknown')),
  email TEXT,
  phone TEXT,
  linkedin TEXT,
  is_current BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_position_history (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  title TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS firm_colleagues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT,
  role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS relationships (
  id TEXT PRIMARY KEY,
  firm_colleague_id TEXT NOT NULL REFERENCES firm_colleagues(id),
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('primary', 'secondary', 'historical', 'introduced_by')),
  strength_score INTEGER NOT NULL CHECK (strength_score BETWEEN 1 AND 5),
  last_interaction_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS interactions (
  id TEXT PRIMARY KEY,
  relationship_id TEXT NOT NULL REFERENCES relationships(id),
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('meeting', 'call', 'email', 'event', 'note')),
  date DATE NOT NULL,
  summary TEXT NOT NULL,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'calendar_sync', 'email_sync')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;
