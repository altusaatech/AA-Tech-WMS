-- Reshape the hardware master to the AA Tech "Hardware Kit" sheet:
-- adds AA Tech profit rate, computed amount, and a kit-item flag.
ALTER TABLE master_hardware ADD COLUMN IF NOT EXISTS aa_tech_profit_rate numeric;
ALTER TABLE master_hardware ADD COLUMN IF NOT EXISTS amount numeric;
ALTER TABLE master_hardware ADD COLUMN IF NOT EXISTS kit boolean NOT NULL DEFAULT false;
