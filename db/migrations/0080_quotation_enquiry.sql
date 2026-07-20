-- 0080 — add Enquiry No to quotations so the Quote Status register can link an
-- enquiry number directly to its quotation's PI. Nullable, idempotent.
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "enquiry_no" text;
CREATE INDEX IF NOT EXISTS "quotations_enquiry_idx" ON "quotations" ("enquiry_no");
