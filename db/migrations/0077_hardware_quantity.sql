-- Add a Quantity column to the hardware master (matches the HARDWARE KIT sheet).
ALTER TABLE master_hardware ADD COLUMN IF NOT EXISTS quantity numeric;
