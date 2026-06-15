-- ProductLab Database Schema
-- Run this in your PostgreSQL instance to create all tables

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id VARCHAR(255),
  email VARCHAR(255),
  name VARCHAR(255),
  plan VARCHAR(50) DEFAULT 'free',
  country VARCHAR(100),
  company VARCHAR(255),
  role VARCHAR(100),
  signup_source VARCHAR(100),
  signed_up_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  traits JSONB
);

CREATE INDEX IF NOT EXISTS users_anonymous_id_idx ON users(anonymous_id);
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_signed_up_at_idx ON users(signed_up_at);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  anonymous_id VARCHAR(255),
  session_id VARCHAR(255),
  event_name VARCHAR(255) NOT NULL,
  event_category VARCHAR(100),
  properties JSONB,
  page VARCHAR(500),
  referrer VARCHAR(500),
  device_type VARCHAR(50),
  browser VARCHAR(100),
  country VARCHAR(100),
  received_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS events_user_id_idx ON events(user_id);
CREATE INDEX IF NOT EXISTS events_event_name_idx ON events(event_name);
CREATE INDEX IF NOT EXISTS events_received_at_idx ON events(received_at);
CREATE INDEX IF NOT EXISTS events_session_id_idx ON events(session_id);

CREATE TABLE IF NOT EXISTS features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(100),
  tracking_event VARCHAR(255),
  is_core BOOLEAN DEFAULT FALSE,
  launched_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  hypothesis TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  type VARCHAR(50) DEFAULT 'ab',
  variants JSONB,
  primary_metric VARCHAR(255),
  secondary_metrics JSONB,
  target_segment VARCHAR(255),
  traffic_allocation REAL DEFAULT 100,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS experiment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id),
  variant VARCHAR(100) NOT NULL,
  metric VARCHAR(255) NOT NULL,
  sample_size INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate REAL DEFAULT 0,
  mean_value REAL,
  std_dev REAL,
  lift_percent REAL,
  p_value REAL,
  confidence_interval JSONB,
  is_significant BOOLEAN DEFAULT FALSE,
  verdict VARCHAR(50),
  calculated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  description TEXT,
  opportunity_score REAL DEFAULT 0,
  user_impact REAL DEFAULT 0,
  business_impact REAL DEFAULT 0,
  confidence_score REAL DEFAULT 0,
  evidence JSONB,
  affected_users INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  discovered_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  opportunity_id UUID REFERENCES opportunities(id),
  status VARCHAR(50) DEFAULT 'backlog',
  reach REAL DEFAULT 0,
  impact REAL DEFAULT 0,
  confidence REAL DEFAULT 0,
  effort REAL DEFAULT 0,
  rice_score REAL DEFAULT 0,
  ice_score REAL DEFAULT 0,
  wsjf_score REAL DEFAULT 0,
  priority_score REAL DEFAULT 0,
  strategic_alignment REAL DEFAULT 0,
  expected_roi REAL DEFAULT 0,
  expected_retention_lift REAL DEFAULT 0,
  expected_revenue_lift REAL DEFAULT 0,
  engineering_cost INTEGER DEFAULT 0,
  recommendation TEXT,
  quarter VARCHAR(20),
  tags JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roadmap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID REFERENCES initiatives(id),
  name VARCHAR(255) NOT NULL,
  quarter VARCHAR(20) NOT NULL,
  status VARCHAR(50) DEFAULT 'planned',
  priority INTEGER DEFAULT 0,
  estimated_weeks INTEGER DEFAULT 2,
  dependencies JSONB,
  expected_outcome TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50),
  target_value REAL,
  current_value REAL,
  unit VARCHAR(50),
  quarter VARCHAR(20),
  status VARCHAR(50) DEFAULT 'on_track',
  created_at TIMESTAMP DEFAULT NOW()
);
