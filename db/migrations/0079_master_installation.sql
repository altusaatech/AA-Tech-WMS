-- Installation master (AA Tech "Installation" sheet) — per building-height
-- installation charges with an AA Tech profit rate.
CREATE TABLE IF NOT EXISTS master_installation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sr_no integer GENERATED ALWAYS AS IDENTITY,
  scope text,
  rate numeric,
  aa_tech_profit_rate numeric,
  amount numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
