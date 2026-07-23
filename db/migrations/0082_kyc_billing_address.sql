-- 0082 — add Billing Address to Customer KYC. Idempotent.
ALTER TABLE "sales_kyc" ADD COLUMN IF NOT EXISTS "billing_address" text;
