-- Add quantity and unit_price columns to campaign_expenses table
ALTER TABLE "campaign_expenses" 
ADD COLUMN IF NOT EXISTS "quantity" integer,
ADD COLUMN IF NOT EXISTS "unit_price" numeric(12, 2);
