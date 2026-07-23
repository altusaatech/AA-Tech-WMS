-- 0081 — Customer KYC register (entry point of the sales flow). Free-form like
-- the other sales trackers; nearly everything nullable. Idempotent.
CREATE TABLE IF NOT EXISTS "sales_kyc" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "sr_no" integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  "enquiry_no" text,
  "enquiry_type" text,
  "enquiry_source" text,
  "company_name" text,
  "company_address" text,
  "delivery_address" text,
  "gst_no" text,
  "contact_person" text,
  "mobile_no" text,
  "email" text,
  "product_details" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "sales_kyc_enquiry_idx" ON "sales_kyc" ("enquiry_no");
