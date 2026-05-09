-- Change volunteer team from single text to array
-- First, add the new teams column
ALTER TABLE volunteers ADD COLUMN teams TEXT[] DEFAULT '{}';

-- Migrate existing team data to teams array
UPDATE volunteers 
SET teams = CASE 
  WHEN team IS NOT NULL AND team != '' THEN ARRAY[team]
  ELSE '{}'
END;

-- Drop the old team column
ALTER TABLE volunteers DROP COLUMN team;
