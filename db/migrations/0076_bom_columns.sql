-- BOM Status used a clone of the SO columns. Add the real BOM Status fields
-- (from the Anant Avinya Technologies System workbook). Old columns are left
-- in place to avoid any data loss; they are simply no longer surfaced.
ALTER TABLE sales_bom ADD COLUMN IF NOT EXISTS ga_drawings_folder_link text;
ALTER TABLE sales_bom ADD COLUMN IF NOT EXISTS bom_folder_link text;
ALTER TABLE sales_bom ADD COLUMN IF NOT EXISTS bom_status text;
ALTER TABLE sales_bom ADD COLUMN IF NOT EXISTS reasons_for_delay text;
ALTER TABLE sales_bom ADD COLUMN IF NOT EXISTS bom_related_notes text;
ALTER TABLE sales_bom ADD COLUMN IF NOT EXISTS bom_amendment_needed boolean NOT NULL DEFAULT false;
ALTER TABLE sales_bom ADD COLUMN IF NOT EXISTS bom_amendment_reasons text;
ALTER TABLE sales_bom ADD COLUMN IF NOT EXISTS bom_amendment_date date;
ALTER TABLE sales_bom ADD COLUMN IF NOT EXISTS no_of_days integer;
ALTER TABLE sales_bom ADD COLUMN IF NOT EXISTS bom_target_date date;
ALTER TABLE sales_bom ADD COLUMN IF NOT EXISTS bom_actual_date date;
ALTER TABLE sales_bom ADD COLUMN IF NOT EXISTS bom_no text;
