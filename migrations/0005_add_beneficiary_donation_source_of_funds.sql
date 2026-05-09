-- Add source of funds fields to beneficiary donations
ALTER TABLE beneficiary_donations ADD COLUMN IF NOT EXISTS source_of_funds TEXT;
ALTER TABLE beneficiary_donations ADD COLUMN IF NOT EXISTS campaign_id VARCHAR REFERENCES campaigns(id) ON DELETE SET NULL;
ALTER TABLE beneficiary_donations ADD COLUMN IF NOT EXISTS event_id VARCHAR REFERENCES events(id) ON DELETE SET NULL;
ALTER TABLE beneficiary_donations ADD COLUMN IF NOT EXISTS livestream_id VARCHAR REFERENCES livestreams(id) ON DELETE SET NULL;
