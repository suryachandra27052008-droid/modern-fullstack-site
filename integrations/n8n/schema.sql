-- Optional private automation destination. Not applied by the website deployment.
CREATE TABLE IF NOT EXISTS autixai_leads (
  id text PRIMARY KEY CHECK (id ~ '^lead_[a-f0-9]{32}$'),
  created_at timestamptz NOT NULL,
  payload jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS autixai_outbox (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lead_id text NOT NULL REFERENCES autixai_leads(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('team_notification','customer_acknowledgement')),
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','processing','sent','review')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lead_id, kind)
);
CREATE TABLE IF NOT EXISTS autixai_followups (
  lead_id text PRIMARY KEY REFERENCES autixai_leads(id) ON DELETE CASCADE,
  state text NOT NULL DEFAULT 'pending',
  assigned_to text,
  due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
