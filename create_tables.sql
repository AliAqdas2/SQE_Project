-- PostgreSQL CREATE TABLE statements for schema tables (lines 674-2238)
-- Generated from Drizzle ORM schema definitions

-- Subscriptions table - tracks organization module subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  module_id VARCHAR NOT NULL REFERENCES marketplace_modules(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL,
  billing_period TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  canceled_at TIMESTAMP,
  referral_code TEXT REFERENCES referral_codes(code),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Subscription Plans table - defines the 5 subscription tiers (all modules included)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  min_members INTEGER NOT NULL,
  max_members INTEGER,
  base_monthly_price DECIMAL(10, 2) NOT NULL,
  base_yearly_price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  stripe_monthly_price_id TEXT,
  stripe_yearly_price_id TEXT,
  stripe_product_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Country Pricing table - allows Eco Admins to customize pricing per country
CREATE TABLE IF NOT EXISTS country_pricing (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  currency TEXT NOT NULL,
  tier_code TEXT NOT NULL,
  monthly_price DECIMAL(10, 2) NOT NULL,
  yearly_price DECIMAL(10, 2) NOT NULL,
  vat_rate DECIMAL(5, 2) DEFAULT 0,
  rounding_rule TEXT DEFAULT 'none',
  stripe_monthly_price_id TEXT,
  stripe_yearly_price_id TEXT,
  created_by_admin_id VARCHAR REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(country_code, tier_code)
);

-- Organization Subscriptions table - tracks the main subscription plan for each organization
CREATE TABLE IF NOT EXISTS organization_subscriptions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id VARCHAR NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id VARCHAR NOT NULL REFERENCES subscription_plans(id),
  billing_cycle TEXT NOT NULL,
  member_count INTEGER NOT NULL DEFAULT 0,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMP,
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  auto_upgrade_queued BOOLEAN NOT NULL DEFAULT false,
  last_renewal_reminder_sent_at TIMESTAMP,
  last_renewal_reminder_for_period_end TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Subscription Items table - tracks individual items on a Stripe subscription (tier + modules)
CREATE TABLE IF NOT EXISTS subscription_items (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id VARCHAR NOT NULL REFERENCES organization_subscriptions(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  tier_code TEXT,
  module_id VARCHAR REFERENCES marketplace_modules(id) ON DELETE CASCADE,
  stripe_price_id TEXT NOT NULL,
  stripe_subscription_item_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Campaign Updates table - for timeline updates with images
CREATE TABLE IF NOT EXISTS campaign_updates (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  show_on_public_page BOOLEAN NOT NULL DEFAULT false,
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Campaign Expenses table - for expense tracking
CREATE TABLE IF NOT EXISTS campaign_expenses (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  category TEXT NOT NULL,
  date TIMESTAMP NOT NULL,
  receipt_url TEXT,
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Campaign Chat Messages table - for AI Campaign Manager chat history
CREATE TABLE IF NOT EXISTS campaign_chat_messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Campaign Strategies table - AI-generated marketing strategies
CREATE TABLE IF NOT EXISTS campaign_strategies (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  summary TEXT,
  insights JSONB,
  model TEXT NOT NULL DEFAULT 'gpt-4o',
  generated_by VARCHAR REFERENCES users(id),
  generated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- P2P Campaign Settings - Campaign-level P2P configuration
CREATE TABLE IF NOT EXISTS p2p_campaign_settings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR NOT NULL UNIQUE REFERENCES campaigns(id) ON DELETE CASCADE,
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  require_approval BOOLEAN NOT NULL DEFAULT false,
  default_participant_goal DECIMAL(12, 2),
  welcome_message TEXT,
  participant_instructions TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- P2P Participants - Individual fundraisers
CREATE TABLE IF NOT EXISTS p2p_participants (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  donor_id VARCHAR REFERENCES donors(id) ON DELETE SET NULL,
  user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  goal_amount DECIMAL(12, 2) NOT NULL,
  raised_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  donation_count INTEGER NOT NULL DEFAULT 0,
  role TEXT NOT NULL DEFAULT 'participant',
  status TEXT NOT NULL DEFAULT 'pending',
  deleted_at TIMESTAMP,
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_active TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- P2P Invitations - Track sent invitations
CREATE TABLE IF NOT EXISTS p2p_invitations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  invited_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, email)
);

-- P2P Milestones - Campaign-level milestone templates
CREATE TABLE IF NOT EXISTS p2p_milestones (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_value DECIMAL(12, 2) NOT NULL,
  email_subject TEXT,
  email_body TEXT,
  badge_icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- P2P Participant Milestones - Track milestone completion per participant
CREATE TABLE IF NOT EXISTS p2p_participant_milestones (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id VARCHAR NOT NULL REFERENCES p2p_participants(id) ON DELETE CASCADE,
  milestone_id VARCHAR NOT NULL REFERENCES p2p_milestones(id) ON DELETE CASCADE,
  progress DECIMAL(5, 2) NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  email_sent_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- P2P Chat Messages - Participant chat room
CREATE TABLE IF NOT EXISTS p2p_chat_messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  participant_id VARCHAR REFERENCES p2p_participants(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL DEFAULT 'participant',
  message TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- P2P Gamification Badges - Achievement badge definitions
CREATE TABLE IF NOT EXISTS p2p_gamification_badges (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR REFERENCES campaigns(id) ON DELETE CASCADE,
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  badge_type TEXT NOT NULL,
  threshold DECIMAL(12, 2),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- P2P Participant Badges - Awarded badges to participants
CREATE TABLE IF NOT EXISTS p2p_participant_badges (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id VARCHAR NOT NULL REFERENCES p2p_participants(id) ON DELETE CASCADE,
  badge_id VARCHAR NOT NULL REFERENCES p2p_gamification_badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- P2P Documents - Document library for participants
CREATE TABLE IF NOT EXISTS p2p_documents (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  category TEXT,
  access_scope TEXT NOT NULL DEFAULT 'all_participants',
  download_count INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMP,
  uploaded_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Livestreams table - for live worship/event giving
CREATE TABLE IF NOT EXISTS livestreams (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id VARCHAR REFERENCES campaigns(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  platform TEXT NOT NULL,
  video_id TEXT,
  embed_url TEXT,
  chat_url TEXT,
  scheduled_start TIMESTAMP NOT NULL,
  scheduled_end TIMESTAMP,
  actual_start TIMESTAMP,
  actual_end TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'scheduled',
  total_raised DECIMAL(12, 2) NOT NULL DEFAULT 0,
  donor_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  ticket_price DECIMAL(10, 2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  replay_available BOOLEAN NOT NULL DEFAULT true,
  ai_insights JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Livestream Donations table - donations made during livestreams
CREATE TABLE IF NOT EXISTS livestream_donations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  livestream_id VARCHAR NOT NULL REFERENCES livestreams(id) ON DELETE CASCADE,
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  donor_id VARCHAR REFERENCES donors(id) ON DELETE SET NULL,
  donor_name TEXT NOT NULL,
  donor_email TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  category TEXT,
  message TEXT,
  show_name BOOLEAN NOT NULL DEFAULT true,
  show_amount BOOLEAN NOT NULL DEFAULT true,
  highlighted BOOLEAN NOT NULL DEFAULT false,
  stripe_payment_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Livestream Chat Messages table - for real-time chat feed
CREATE TABLE IF NOT EXISTS livestream_chat_messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  livestream_id VARCHAR NOT NULL REFERENCES livestreams(id) ON DELETE CASCADE,
  donor_id VARCHAR REFERENCES donors(id) ON DELETE SET NULL,
  donor_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_donor BOOLEAN NOT NULL DEFAULT false,
  donor_badge TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Livestream Access table - for ticketed livestream access control
CREATE TABLE IF NOT EXISTS livestream_access (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  livestream_id VARCHAR NOT NULL REFERENCES livestreams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  access_token TEXT NOT NULL UNIQUE,
  stripe_payment_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Contacts table - comprehensive contact management for charities
CREATE TABLE IF NOT EXISTS contacts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  street TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT,
  company TEXT,
  job_title TEXT,
  types TEXT[] NOT NULL DEFAULT '{}',
  total_donated DECIMAL(12, 2) DEFAULT 0,
  donation_count INTEGER DEFAULT 0,
  last_donation_date TIMESTAMP,
  donor_tier TEXT,
  skills TEXT[] DEFAULT '{}',
  availability TEXT,
  hours_contributed INTEGER DEFAULT 0,
  volunteer_status TEXT,
  sponsorship_level TEXT,
  sponsorship_amount DECIMAL(12, 2),
  contract_start_date TIMESTAMP,
  contract_end_date TIMESTAMP,
  lead_source TEXT,
  lead_status TEXT,
  lead_score INTEGER,
  preferred_contact_method TEXT,
  email_opt_in BOOLEAN DEFAULT true,
  sms_opt_in BOOLEAN DEFAULT false,
  notes TEXT,
  last_contacted_date TIMESTAMP,
  next_follow_up_date TIMESTAMP,
  linkedin_url TEXT,
  twitter_handle TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Contact Tags table - flexible tagging system
CREATE TABLE IF NOT EXISTS contact_tags (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Contact Tags Junction table - many-to-many relationship between contacts and tags
CREATE TABLE IF NOT EXISTS contact_tag_assignments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id VARCHAR NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id VARCHAR NOT NULL REFERENCES contact_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Contact Activities table - track interactions and history
CREATE TABLE IF NOT EXISTS contact_activities (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id VARCHAR NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  subject TEXT,
  description TEXT,
  outcome TEXT,
  user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Prayer Settings table - for Muslim Prayer Timetable module
CREATE TABLE IF NOT EXISTS prayer_settings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id VARCHAR NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  calculation_method INTEGER NOT NULL DEFAULT 2,
  timezone TEXT NOT NULL,
  cached_prayer_times JSONB DEFAULT '{}',
  last_fetched TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Landing Pages table
CREATE TABLE IF NOT EXISTS landing_pages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  hero_image_url TEXT,
  banner_image_url TEXT,
  about_us TEXT,
  page_components JSONB NOT NULL DEFAULT '[]',
  settings JSONB NOT NULL DEFAULT '{"primaryColor":"#00BCD4","secondaryColor":"#FF5722","fontFamily":"Inter","showCampaigns":true,"showEvents":true,"showLivestreams":true,"showDonations":true,"showPrayerTimes":false,"showSermons":false,"showVolunteers":false,"showChatbot":true,"moduleOrder":["campaigns","events","livestreams","donations","prayerTimes","sermons","volunteers"]}',
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Email Templates table for thank you notes and notifications
CREATE TABLE IF NOT EXISTS email_templates (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_type TEXT,
  subject TEXT NOT NULL,
  preview_text TEXT,
  html_body TEXT,
  text_body TEXT,
  blocks JSONB DEFAULT '[]',
  thumbnail_url TEXT,
  donation_type TEXT,
  min_amount DECIMAL(10, 2),
  max_amount DECIMAL(10, 2),
  priority INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sermon Categories table
CREATE TABLE IF NOT EXISTS sermon_categories (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sermon Tags table
CREATE TABLE IF NOT EXISTS sermon_tags (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sermons table - Main sermon media library
CREATE TABLE IF NOT EXISTS sermons (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  speaker TEXT NOT NULL,
  sermon_date TIMESTAMP NOT NULL,
  category_id VARCHAR REFERENCES sermon_categories(id) ON DELETE SET NULL,
  video_url TEXT,
  audio_url TEXT,
  notes_url TEXT,
  thumbnail_url TEXT,
  platform TEXT,
  platform_video_id TEXT,
  duration INTEGER,
  views INTEGER NOT NULL DEFAULT 0,
  scripture TEXT[],
  ai_summary TEXT,
  ai_notes TEXT,
  search_embedding TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sermon Tag Assignments (many-to-many)
CREATE TABLE IF NOT EXISTS sermon_tag_assignments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  sermon_id VARCHAR NOT NULL REFERENCES sermons(id) ON DELETE CASCADE,
  tag_id VARCHAR NOT NULL REFERENCES sermon_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Volunteers table - Volunteer profiles and management
CREATE TABLE IF NOT EXISTS volunteers (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  date_of_birth TIMESTAMP,
  street TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT,
  photo_url TEXT,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  availability JSONB DEFAULT '{}',
  preferred_roles TEXT[] DEFAULT '{}',
  team TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  total_hours INTEGER NOT NULL DEFAULT 0,
  shift_count INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMP,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  notes TEXT,
  background_check_status TEXT,
  background_check_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Volunteer Shifts table - Shift scheduling and assignments
CREATE TABLE IF NOT EXISTS volunteer_shifts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  volunteer_id VARCHAR NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  event_id VARCHAR REFERENCES events(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  shift_date TIMESTAMP NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  role TEXT,
  team TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  reminder_sent_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Volunteer Hours table - Manual hour logging and tracking
CREATE TABLE IF NOT EXISTS volunteer_hours (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  volunteer_id VARCHAR NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  shift_id VARCHAR REFERENCES volunteer_shifts(id) ON DELETE SET NULL,
  date TIMESTAMP NOT NULL,
  hours_worked DECIMAL(5, 2) NOT NULL,
  activity TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by VARCHAR REFERENCES users(id),
  approved_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Beneficiaries table - Individuals and organizations receiving support
CREATE TABLE IF NOT EXISTS beneficiaries (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  organization_name TEXT,
  date_of_birth TIMESTAMP,
  gender TEXT,
  email TEXT,
  phone TEXT,
  street TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT,
  photo_url TEXT,
  biography TEXT,
  occupation TEXT,
  education TEXT,
  languages JSONB DEFAULT '[]',
  health_status TEXT,
  medical_conditions JSONB DEFAULT '[]',
  disabilities TEXT,
  medications JSONB DEFAULT '[]',
  allergies JSONB DEFAULT '[]',
  last_medical_checkup TIMESTAMP,
  primary_needs JSONB DEFAULT '[]',
  urgency_level TEXT NOT NULL DEFAULT 'medium',
  housing_status TEXT,
  employment_status TEXT,
  monthly_income DECIMAL(12, 2),
  number_of_dependents INTEGER DEFAULT 0,
  total_donations_received DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_gifts_received INTEGER NOT NULL DEFAULT 0,
  first_support_date TIMESTAMP,
  last_support_date TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'active',
  case_manager TEXT,
  referral_source TEXT,
  tags JSONB DEFAULT '[]',
  internal_notes TEXT,
  public_notes TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMP,
  verified_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Beneficiary Donations table - Links donations/gifts to beneficiaries
CREATE TABLE IF NOT EXISTS beneficiary_donations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  beneficiary_id VARCHAR NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
  donation_id VARCHAR REFERENCES donations(id) ON DELETE SET NULL,
  donation_type TEXT NOT NULL,
  amount DECIMAL(12, 2),
  currency TEXT DEFAULT 'USD',
  description TEXT NOT NULL,
  quantity INTEGER,
  delivery_date TIMESTAMP NOT NULL,
  delivery_method TEXT,
  delivered_by TEXT,
  receipt_url TEXT,
  impact_notes TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Beneficiary Communications table - Timeline of all interactions
CREATE TABLE IF NOT EXISTS beneficiary_communications (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  beneficiary_id VARCHAR NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  direction TEXT,
  communication_date TIMESTAMP NOT NULL DEFAULT NOW(),
  staff_member TEXT,
  attachments JSONB DEFAULT '[]',
  requires_follow_up BOOLEAN DEFAULT false,
  follow_up_date TIMESTAMP,
  follow_up_completed BOOLEAN DEFAULT false,
  tags JSONB DEFAULT '[]',
  priority TEXT DEFAULT 'normal',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Prayer Requests table - Public prayer wall
CREATE TABLE IF NOT EXISTS prayer_requests (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  submitter_name TEXT,
  submitter_email TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  request_text TEXT NOT NULL,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  moderation_status TEXT NOT NULL DEFAULT 'pending',
  moderation_notes TEXT,
  reviewed_by VARCHAR REFERENCES users(id),
  reviewed_at TIMESTAMP,
  ai_suggestions JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  is_pinned BOOLEAN DEFAULT false,
  prayer_count INTEGER NOT NULL DEFAULT 0,
  is_answered BOOLEAN DEFAULT false,
  answered_at TIMESTAMP,
  answered_note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Activities table - Classes and courses
CREATE TABLE IF NOT EXISTS activities (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category TEXT,
  tags JSONB,
  teacher_name TEXT,
  teacher_id VARCHAR,
  teacher_bio TEXT,
  teacher_image_url TEXT,
  is_free BOOLEAN NOT NULL DEFAULT true,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  max_students INTEGER,
  current_students INTEGER NOT NULL DEFAULT 0,
  allow_waitlist BOOLEAN NOT NULL DEFAULT false,
  schedule_type TEXT NOT NULL DEFAULT 'weekly',
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'draft',
  is_published BOOLEAN NOT NULL DEFAULT false,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  settings JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Activity Sessions table - Timetable/Schedule
CREATE TABLE IF NOT EXISTS activity_sessions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id VARCHAR NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  session_date TIMESTAMP NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Activity Registrations table - Enrolled students
CREATE TABLE IF NOT EXISTS activity_registrations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id VARCHAR NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_phone TEXT,
  parent_name TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',
  stripe_payment_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Activity Attendance table - Attendance register
CREATE TABLE IF NOT EXISTS activity_attendance (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id VARCHAR NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  registration_id VARCHAR NOT NULL REFERENCES activity_registrations(id) ON DELETE CASCADE,
  session_date TIMESTAMP NOT NULL,
  attended BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Member Tags table - for organizing members into groups
CREATE TABLE IF NOT EXISTS member_tags (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Member Tag Assignments table - many-to-many relationship
CREATE TABLE IF NOT EXISTS member_tag_assignments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  member_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag_id VARCHAR NOT NULL REFERENCES member_tags(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Email Campaigns table - email sends
CREATE TABLE IF NOT EXISTS email_campaigns (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id VARCHAR REFERENCES email_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  preview_text TEXT,
  blocks JSONB NOT NULL DEFAULT '[]',
  recipient_type TEXT NOT NULL,
  recipient_tags JSONB DEFAULT '[]',
  recipient_emails JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  total_recipients INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  opened_count INTEGER NOT NULL DEFAULT 0,
  clicked_count INTEGER NOT NULL DEFAULT 0,
  bounced_count INTEGER NOT NULL DEFAULT 0,
  unsubscribed_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Email Recipients table - individual send tracking
CREATE TABLE IF NOT EXISTS email_recipients (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  resend_email_id TEXT,
  unsubscribe_token TEXT NOT NULL,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  bounced_at TIMESTAMP,
  unsubscribed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Email Events table - detailed event tracking from Resend webhooks
CREATE TABLE IF NOT EXISTS email_events (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR REFERENCES email_campaigns(id) ON DELETE CASCADE,
  recipient_id VARCHAR REFERENCES email_recipients(id) ON DELETE CASCADE,
  resend_email_id TEXT,
  event_type TEXT NOT NULL,
  email TEXT,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

