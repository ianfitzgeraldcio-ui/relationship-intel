CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  org_type VARCHAR(50) NOT NULL CHECK (org_type IN ('utility', 'regulator', 'rto_iso', 'firm', 'other')),
  ownership_category VARCHAR(50) CHECK (ownership_category IN ('iou', 'cooperative', 'municipal', 'pud')),
  state VARCHAR(2),
  meter_count INTEGER,
  total_revenue NUMERIC(15,2),
  website VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_org_name_tsvector ON organizations USING GIN (to_tsvector('english', name));
CREATE INDEX idx_org_type ON organizations(org_type);
CREATE INDEX idx_org_state ON organizations(state);

CREATE TABLE firm_colleagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  role_category VARCHAR(50) CHECK (role_category IN ('executive', 'regulatory_affairs', 'board_member', 'procurement', 'technical', 'other')),
  decision_authority VARCHAR(50) DEFAULT 'unknown' CHECK (decision_authority IN ('decision_maker', 'influencer', 'gatekeeper', 'unknown')),
  email VARCHAR(255),
  phone VARCHAR(20),
  linkedin_url VARCHAR(255),
  is_current BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contact_name_tsvector ON contacts USING GIN (to_tsvector('english', full_name));
CREATE INDEX idx_contact_org_id ON contacts(organization_id);

CREATE TABLE contact_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_colleague_id UUID NOT NULL REFERENCES firm_colleagues(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  strength_score_manual INTEGER CHECK (strength_score_manual >= 1 AND strength_score_manual <= 5),
  relationship_type VARCHAR(50) CHECK (relationship_type IN ('primary', 'secondary', 'historical', 'introduced_by')),
  last_interaction_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(firm_colleague_id, contact_id)
);

CREATE INDEX idx_rel_contact_id ON relationships(contact_id);
CREATE INDEX idx_rel_colleague_id ON relationships(firm_colleague_id);
CREATE INDEX idx_rel_last_interaction ON relationships(last_interaction_at);

CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID REFERENCES relationships(id) ON DELETE SET NULL,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  firm_colleague_id UUID NOT NULL REFERENCES firm_colleagues(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('meeting', 'call', 'email', 'event', 'note')),
  occurred_at TIMESTAMP NOT NULL,
  summary TEXT NOT NULL,
  sentiment VARCHAR(50) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  source VARCHAR(50) DEFAULT 'manual' CHECK (source IN ('manual', 'calendar_sync', 'email_sync')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_interaction_contact_id ON interactions(contact_id);
CREATE INDEX idx_interaction_relationship_id ON interactions(relationship_id);
CREATE INDEX idx_interaction_colleague_id ON interactions(firm_colleague_id);

CREATE TABLE business_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  outcome_type VARCHAR(50) NOT NULL CHECK (outcome_type IN ('proposal', 'engagement', 'renewal', 'lost')),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  value NUMERIC(15,2),
  status VARCHAR(50) CHECK (status IN ('active', 'won', 'lost', 'pending')),
  close_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE relationship_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
  outcome_id UUID NOT NULL REFERENCES business_outcomes(id) ON DELETE CASCADE,
  role VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(relationship_id, outcome_id)
);

CREATE TABLE technology_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  technology_name VARCHAR(255) NOT NULL,
  year_deployed INTEGER,
  vendor_name VARCHAR(255),
  implementation_cost NUMERIC(15,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  vendor_type VARCHAR(50),
  specializations TEXT,
  website VARCHAR(255),
  headquarters_location VARCHAR(255),
  annual_revenue NUMERIC(15,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vendor_name_tsvector ON vendors USING GIN (to_tsvector('english', name));

CREATE TABLE vendor_partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  partnership_type VARCHAR(50),
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, vendor_id)
);

CREATE TABLE vendor_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  role VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vendor_id, contact_id)
);

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  tag_type VARCHAR(50) NOT NULL CHECK (tag_type IN ('contact', 'relationship', 'vendor')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contact_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(contact_id, tag_id)
);

CREATE TABLE relationship_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(relationship_id, tag_id)
);

CREATE TABLE vendor_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vendor_id, tag_id)
);
