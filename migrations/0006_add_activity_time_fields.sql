-- Add time fields to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS end_time TEXT;

