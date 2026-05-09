-- Add address field to donors table
ALTER TABLE donors ADD COLUMN IF NOT EXISTS address TEXT;
