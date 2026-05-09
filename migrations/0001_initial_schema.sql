-- Plegit Database Schema Migration
-- This migration creates all tables for the Plegit platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table - multi-tenant root entity
CREATE TABLE organizations (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    email text NOT NULL,
    phone text,
    logo_url text,
    primary_color text DEFAULT '#00BCD4',
    religion text,
    street text,
    city text,
    state text,
    zip text,
    country text,
    timezone text DEFAULT 'America/New_York',
    currency text DEFAULT 'USD',
    date_format text DEFAULT 'MM/DD/YYYY',
    stripe_customer_id text UNIQUE,
    stripe_account_id text UNIQUE,
    stripe_access_token text,
    stripe_refresh_token text,
    stripe_scope text,
    stripe_account_status text,
    status text DEFAULT 'pending' NOT NULL,
    reviewed_at timestamp,
    approved_by varchar,
    incorporation_doc_url text,
    settings jsonb DEFAULT '{}',
    created_at timestamp DEFAULT now() NOT NULL
);

-- Users table for authentication
CREATE TABLE users (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar REFERENCES organizations(id) ON DELETE CASCADE,
    email text NOT NULL UNIQUE,
    password_hash text,
    password_set_at timestamp,
    first_name text NOT NULL,
    last_name text NOT NULL,
    role text DEFAULT 'org_admin' NOT NULL,
    email_opted_out boolean DEFAULT false NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL
);

-- Dashboard Preferences table
CREATE TABLE dashboard_preferences (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    widget_layout jsonb DEFAULT '{"enabled":["donations","campaigns","events","volunteers","recent-activity"],"order":["donations","campaigns","events","volunteers","recent-activity"],"sizes":{}}' NOT NULL,
    date_range_preset text DEFAULT 'last30days',
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    UNIQUE(user_id, org_id)
);

-- AI Conversations table
CREATE TABLE ai_conversations (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title text DEFAULT 'New Conversation',
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- AI Messages table
CREATE TABLE ai_messages (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id varchar NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL
);

-- Organization Registrations table
CREATE TABLE organization_registrations (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    charity_name text NOT NULL,
    contact_first_name text,
    contact_last_name text,
    contact_email text,
    contact_phone text,
    street text,
    city text,
    state text,
    zip text,
    country text,
    timezone text,
    currency text,
    date_format text,
    incorporation_doc_url text,
    current_step integer DEFAULT 1 NOT NULL,
    status text DEFAULT 'draft' NOT NULL,
    submitted_at timestamp,
    reviewed_at timestamp,
    reviewed_by varchar,
    rejection_reason text,
    created_at timestamp DEFAULT now() NOT NULL
);

-- Auth Tokens table
CREATE TABLE auth_tokens (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token text NOT NULL UNIQUE,
    type text NOT NULL,
    expires_at timestamp NOT NULL,
    used_at timestamp,
    created_at timestamp DEFAULT now() NOT NULL
);

-- Campaigns table
CREATE TABLE campaigns (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    image_url text,
    goal_amount numeric(12, 2) NOT NULL,
    current_amount numeric(12, 2) DEFAULT '0' NOT NULL,
    category text,
    status text DEFAULT 'active' NOT NULL,
    country text,
    currency text DEFAULT 'USD' NOT NULL,
    start_date timestamp,
    end_date timestamp,
    quick_donation_buttons jsonb DEFAULT '[]',
    page_components jsonb DEFAULT '[]',
    created_at timestamp DEFAULT now() NOT NULL
);

-- Campaign Updates table
CREATE TABLE campaign_updates (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id varchar NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    title text NOT NULL,
    content text NOT NULL,
    image_url text,
    show_on_public_page boolean DEFAULT false NOT NULL,
    created_by varchar REFERENCES users(id),
    created_at timestamp DEFAULT now() NOT NULL
);

-- Campaign Expenses table
CREATE TABLE campaign_expenses (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id varchar NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    description text NOT NULL,
    amount numeric(12, 2) NOT NULL,
    category text NOT NULL,
    date timestamp NOT NULL,
    receipt_url text,
    created_by varchar REFERENCES users(id),
    created_at timestamp DEFAULT now() NOT NULL
);

-- Campaign Chat Messages table
CREATE TABLE campaign_chat_messages (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id varchar NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL
);

-- Campaign Strategies table
CREATE TABLE campaign_strategies (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id varchar NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    content jsonb NOT NULL,
    summary text,
    insights jsonb,
    model text DEFAULT 'gpt-4o' NOT NULL,
    generated_by varchar REFERENCES users(id),
    generated_at timestamp DEFAULT now() NOT NULL
);

-- Donors table
CREATE TABLE donors (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text,
    total_donated numeric(12, 2) DEFAULT '0' NOT NULL,
    donation_count integer DEFAULT 0 NOT NULL,
    tier text DEFAULT 'bronze',
    created_at timestamp DEFAULT now() NOT NULL
);

-- Donor Tags table
CREATE TABLE donor_tags (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    color text DEFAULT '#3B82F6',
    created_at timestamp DEFAULT now() NOT NULL
);

-- Donor Tag Assignments table
CREATE TABLE donor_tag_assignments (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id varchar NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    tag_id varchar NOT NULL REFERENCES donor_tags(id) ON DELETE CASCADE,
    created_at timestamp DEFAULT now() NOT NULL
);


-- Events table
CREATE TABLE events (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    image_url text,
    category text,
    tags text[],
    event_type text DEFAULT 'in-person' NOT NULL,
    date timestamp NOT NULL,
    time text NOT NULL,
    end_time text,
    location text NOT NULL,
    livestream_url text,
    capacity integer NOT NULL,
    attendee_count integer DEFAULT 0 NOT NULL,
    price numeric(10, 2) DEFAULT '0' NOT NULL,
    currency text DEFAULT 'USD' NOT NULL,
    allow_donations boolean DEFAULT false NOT NULL,
    seating_map_url text,
    enable_waitlist boolean DEFAULT true NOT NULL,
    status text DEFAULT 'draft' NOT NULL,
    published_at timestamp,
    is_recurring boolean DEFAULT false NOT NULL,
    recurring_pattern text,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);


-- Event Registrations table

-- Event Ticket Types table
CREATE TABLE event_ticket_types (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id varchar NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    price numeric(10, 2) NOT NULL,
    currency text DEFAULT 'USD' NOT NULL,
    quantity integer NOT NULL,
    sold integer DEFAULT 0 NOT NULL,
    min_per_order integer DEFAULT 1 NOT NULL,
    max_per_order integer DEFAULT 10 NOT NULL,
    seating_plan_url text,
    badge_color text DEFAULT '#3B82F6',
    badge_icon text,
    sales_start timestamp,
    sales_end timestamp,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL
);
CREATE TABLE event_registrations (


    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id varchar NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    ticket_type_id varchar REFERENCES event_ticket_types(id) ON DELETE SET NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text,
    ticket_count integer DEFAULT 1 NOT NULL,
    total_paid numeric(10, 2) NOT NULL,
    donation_amount numeric(10, 2) DEFAULT '0',
    donation_category text,
    promo_code text,
    qr_code text NOT NULL,
    checked_in boolean DEFAULT false NOT NULL,
    checked_in_at timestamp,
    stripe_payment_id text,
    status text DEFAULT 'confirmed' NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL
);

-- Event Promo Codes table
CREATE TABLE event_promo_codes (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id varchar NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    code text NOT NULL,
    discount_type text NOT NULL,
    discount_value numeric(10, 2) NOT NULL,
    max_uses integer,
    used_count integer DEFAULT 0 NOT NULL,
    valid_from timestamp,
    valid_until timestamp,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL
);

-- Event Waitlist table
CREATE TABLE event_waitlist (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id varchar NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text,
    tickets_requested integer DEFAULT 1 NOT NULL,
    notified boolean DEFAULT false NOT NULL,
    notified_at timestamp,
    created_at timestamp DEFAULT now() NOT NULL
);

-- Event Speakers table
CREATE TABLE event_speakers (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id varchar NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name text NOT NULL,
    title text,
    bio text,
    photo_url text,
    company text,
    linkedin_url text,
    twitter_url text,
    website_url text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL
);

-- Event Sponsors table
CREATE TABLE event_sponsors (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id varchar NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name text NOT NULL,
    tier text DEFAULT 'bronze' NOT NULL,
    logo_url text,
    description text,
    website_url text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL
);

-- Marketplace Modules table
CREATE TABLE marketplace_modules (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    module_key text NOT NULL UNIQUE,
    title text NOT NULL,
    description text NOT NULL,
    image_url text,
    is_default boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL
);

-- Module Pricing table
CREATE TABLE module_pricing (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id varchar NOT NULL REFERENCES marketplace_modules(id) ON DELETE CASCADE,
    country text NOT NULL,
    currency text NOT NULL,
    price numeric(10, 2) NOT NULL,
    billing_period text DEFAULT 'monthly' NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL
);

-- Organization Modules table
CREATE TABLE organization_modules (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    module_id varchar NOT NULL REFERENCES marketplace_modules(id) ON DELETE CASCADE,
    enabled_at timestamp DEFAULT now() NOT NULL,
    enabled_by varchar REFERENCES users(id),
    status text DEFAULT 'active' NOT NULL,
    billing_period text DEFAULT 'monthly' NOT NULL,
    next_billing_date timestamp
);

-- Partners table
CREATE TABLE partners (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    contact_person text,
    phone text,
    country text,
    commission_rate numeric(5, 2) DEFAULT '10.00' NOT NULL,
    status text DEFAULT 'active' NOT NULL,
    total_referrals integer DEFAULT 0 NOT NULL,
    total_revenue numeric(12, 2) DEFAULT '0' NOT NULL,
    created_by varchar REFERENCES users(id),
    created_at timestamp DEFAULT now() NOT NULL
);

-- Referral Codes table
CREATE TABLE referral_codes (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id varchar NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    code text NOT NULL UNIQUE,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    usage_count integer DEFAULT 0 NOT NULL,
    expires_at timestamp,
    created_at timestamp DEFAULT now() NOT NULL
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    module_id varchar NOT NULL REFERENCES marketplace_modules(id) ON DELETE CASCADE,
    stripe_subscription_id text UNIQUE,
    stripe_customer_id text,
    status text NOT NULL,
    billing_period text NOT NULL,
    amount numeric(10, 2) NOT NULL,
    currency text NOT NULL,
    current_period_start timestamp,
    current_period_end timestamp,
    canceled_at timestamp,
    referral_code text REFERENCES referral_codes(code),
    created_at timestamp DEFAULT now() NOT NULL
);

-- Subscription Plans table
CREATE TABLE subscription_plans (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_code text NOT NULL UNIQUE,
    name text NOT NULL,
    description text NOT NULL,
    min_members integer NOT NULL,
    max_members integer,
    base_monthly_price numeric(10, 2) NOT NULL,
    base_yearly_price numeric(10, 2) NOT NULL,
    currency text DEFAULT 'GBP' NOT NULL,
    stripe_monthly_price_id text,
    stripe_yearly_price_id text,
    stripe_product_id text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL
);

-- Country Pricing table
CREATE TABLE country_pricing (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code text NOT NULL,
    currency text NOT NULL,
    tier_code text NOT NULL,
    monthly_price numeric(10, 2) NOT NULL,
    yearly_price numeric(10, 2) NOT NULL,
    vat_rate numeric(5, 2) DEFAULT '0',
    rounding_rule text DEFAULT 'none',
    stripe_monthly_price_id text,
    stripe_yearly_price_id text,
    created_by_admin_id varchar REFERENCES users(id),
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    UNIQUE(country_code, tier_code)
);

-- Organization Subscriptions table
CREATE TABLE organization_subscriptions (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id varchar NOT NULL REFERENCES subscription_plans(id),
    billing_cycle text NOT NULL,
    member_count integer DEFAULT 0 NOT NULL,
    stripe_customer_id text UNIQUE,
    stripe_subscription_id text UNIQUE,
    status text NOT NULL,
    current_period_start timestamp,
    current_period_end timestamp,
    cancel_at_period_end boolean DEFAULT false NOT NULL,
    canceled_at timestamp,
    trial_start timestamp,
    trial_end timestamp,
    auto_upgrade_queued boolean DEFAULT false NOT NULL,
    last_renewal_reminder_sent_at timestamp,
    last_renewal_reminder_for_period_end timestamp,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Subscription Items table
CREATE TABLE subscription_items (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id varchar NOT NULL REFERENCES organization_subscriptions(id) ON DELETE CASCADE,
    type text NOT NULL,
    tier_code text,
    module_id varchar REFERENCES marketplace_modules(id) ON DELETE CASCADE,
    stripe_price_id text NOT NULL,
    stripe_subscription_item_id text UNIQUE,
    status text DEFAULT 'active' NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL
);

-- P2P Campaign Settings table
CREATE TABLE p2p_campaign_settings (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id varchar NOT NULL UNIQUE REFERENCES campaigns(id) ON DELETE CASCADE,
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    is_enabled boolean DEFAULT true NOT NULL,
    require_approval boolean DEFAULT false NOT NULL,
    default_participant_goal numeric(12, 2),
    welcome_message text,
    participant_instructions text,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- P2P Participants table
CREATE TABLE p2p_participants (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id varchar NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    donor_id varchar REFERENCES donors(id) ON DELETE SET NULL,
    user_id varchar REFERENCES users(id) ON DELETE SET NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    slug text NOT NULL UNIQUE,
    avatar_url text,
    bio text,
    goal_amount numeric(12, 2) NOT NULL,
    raised_amount numeric(12, 2) DEFAULT '0' NOT NULL,
    donation_count integer DEFAULT 0 NOT NULL,
    role text DEFAULT 'participant' NOT NULL,
    status text DEFAULT 'pending' NOT NULL,
    deleted_at timestamp,
    joined_at timestamp DEFAULT now() NOT NULL,
    last_active timestamp,
    created_at timestamp DEFAULT now() NOT NULL
);

-- P2P Invitations table
CREATE TABLE p2p_invitations (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id varchar NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    invited_by varchar REFERENCES users(id) ON DELETE SET NULL,
    email text NOT NULL,
    token text NOT NULL UNIQUE,
    status text DEFAULT 'pending' NOT NULL,
    expires_at timestamp NOT NULL,
    accepted_at timestamp,
    deleted_at timestamp,
    created_at timestamp DEFAULT now() NOT NULL,
    UNIQUE(campaign_id, email)
);

-- P2P Milestones table
CREATE TABLE p2p_milestones (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id varchar NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    trigger_type text NOT NULL,
    trigger_value numeric(12, 2) NOT NULL,
    email_subject text,
    email_body text,
    badge_icon text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL
);

-- P2P Participant Milestones table
CREATE TABLE p2p_participant_milestones (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id varchar NOT NULL REFERENCES p2p_participants(id) ON DELETE CASCADE,
    milestone_id varchar NOT NULL REFERENCES p2p_milestones(id) ON DELETE CASCADE,
    progress numeric(5, 2) DEFAULT '0' NOT NULL,
    is_completed boolean DEFAULT false NOT NULL,
    completed_at timestamp,
    email_sent boolean DEFAULT false NOT NULL,
    email_sent_at timestamp,
    created_at timestamp DEFAULT now() NOT NULL
);

-- P2P Chat Messages table
CREATE TABLE p2p_chat_messages (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id varchar NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    participant_id varchar REFERENCES p2p_participants(id) ON DELETE SET NULL,
    sender_name text NOT NULL,
    sender_role text DEFAULT 'participant' NOT NULL,
    message text NOT NULL,
    attachment_url text,
    created_at timestamp DEFAULT now() NOT NULL
);

-- P2P Gamification Badges table
CREATE TABLE p2p_gamification_badges (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id varchar REFERENCES campaigns(id) ON DELETE CASCADE,
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    icon text NOT NULL,
    badge_type text NOT NULL,
    threshold numeric(12, 2),
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL
);

-- P2P Participant Badges table
CREATE TABLE p2p_participant_badges (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id varchar NOT NULL REFERENCES p2p_participants(id) ON DELETE CASCADE,
    badge_id varchar NOT NULL REFERENCES p2p_gamification_badges(id) ON DELETE CASCADE,
    awarded_at timestamp DEFAULT now() NOT NULL
);

-- P2P Documents table
CREATE TABLE p2p_documents (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id varchar NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    file_url text NOT NULL,
    file_name text NOT NULL,
    file_size integer,
    file_type text,
    category text,
    access_scope text DEFAULT 'all_participants' NOT NULL,
    download_count integer DEFAULT 0 NOT NULL,
    deleted_at timestamp,
    uploaded_by varchar REFERENCES users(id),
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Livestreams table
CREATE TABLE livestreams (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    campaign_id varchar REFERENCES campaigns(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    thumbnail_url text,
    platform text NOT NULL,
    video_id text,
    embed_url text,
    chat_url text,
    scheduled_start timestamp NOT NULL,
    scheduled_end timestamp,
    actual_start timestamp,
    actual_end timestamp,
    status text DEFAULT 'scheduled' NOT NULL,
    total_raised numeric(12, 2) DEFAULT '0' NOT NULL,
    donor_count integer DEFAULT 0 NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    is_paid boolean DEFAULT false NOT NULL,
    ticket_price numeric(10, 2) DEFAULT '0',
    currency text DEFAULT 'USD' NOT NULL,
    replay_available boolean DEFAULT true NOT NULL,
    ai_insights jsonb DEFAULT '{}',
    created_at timestamp DEFAULT now() NOT NULL
);

-- Livestream Donations table
CREATE TABLE livestream_donations (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    livestream_id varchar NOT NULL REFERENCES livestreams(id) ON DELETE CASCADE,
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    donor_id varchar REFERENCES donors(id) ON DELETE SET NULL,
    donor_name text NOT NULL,
    donor_email text NOT NULL,
    amount numeric(12, 2) NOT NULL,
    currency text DEFAULT 'USD' NOT NULL,
    category text,
    message text,
    show_name boolean DEFAULT true NOT NULL,
    show_amount boolean DEFAULT true NOT NULL,
    highlighted boolean DEFAULT false NOT NULL,
    stripe_payment_id text,
    created_at timestamp DEFAULT now() NOT NULL
);
-- Donations table
CREATE TABLE donations (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    campaign_id varchar REFERENCES campaigns(id) ON DELETE SET NULL,
    event_id varchar REFERENCES events(id) ON DELETE SET NULL,
    livestream_id varchar REFERENCES livestreams(id) ON DELETE SET NULL,
    donor_id varchar REFERENCES donors(id) ON DELETE SET NULL,
    amount numeric(12, 2) NOT NULL,
    currency text DEFAULT 'USD' NOT NULL,
    donation_type text DEFAULT 'online' NOT NULL,
    category text,
    cover_fees boolean DEFAULT false,
    fee_amount numeric(12, 2) DEFAULT '0',
    recurring boolean DEFAULT false NOT NULL,
    frequency text,
    stripe_subscription_id text,
    payment_method text,
    stripe_payment_id text,
    status text DEFAULT 'completed' NOT NULL,
    donor_email text,
    donor_name text,
    message text,
    receipt_url text,
    thank_you_sent boolean DEFAULT false NOT NULL,
    thank_you_sent_at timestamp,
    notes text,
    gift_aid_opt_in boolean DEFAULT false NOT NULL,
    gift_aid_eligible boolean DEFAULT false NOT NULL,
    donor_address text,
    donor_city text,
    donor_postcode text,
    donor_country text,
    tax_relief_amount numeric(12, 2),
    tax_relief_claimed boolean DEFAULT false NOT NULL,
    tax_relief_claimed_at timestamp,
    created_at timestamp DEFAULT now() NOT NULL
);
-- Livestream Chat Messages table
CREATE TABLE livestream_chat_messages (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    livestream_id varchar NOT NULL REFERENCES livestreams(id) ON DELETE CASCADE,
    donor_id varchar REFERENCES donors(id) ON DELETE SET NULL,
    donor_name text NOT NULL,
    message text NOT NULL,
    is_donor boolean DEFAULT false NOT NULL,
    donor_badge text,
    created_at timestamp DEFAULT now() NOT NULL
);

-- Livestream Access table
CREATE TABLE livestream_access (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    livestream_id varchar NOT NULL REFERENCES livestreams(id) ON DELETE CASCADE,
    email text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    access_token text NOT NULL UNIQUE,
    stripe_payment_id text,
    created_at timestamp DEFAULT now() NOT NULL
);

-- Contacts table
CREATE TABLE contacts (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text,
    street text,
    city text,
    state text,
    zip text,
    country text,
    company text,
    job_title text,
    types text[] DEFAULT '{}' NOT NULL,
    total_donated numeric(12, 2) DEFAULT '0',
    donation_count integer DEFAULT 0,
    last_donation_date timestamp,
    donor_tier text,
    skills text[] DEFAULT '{}',
    availability text,
    hours_contributed integer DEFAULT 0,
    volunteer_status text,
    sponsorship_level text,
    sponsorship_amount numeric(12, 2),
    contract_start_date timestamp,
    contract_end_date timestamp,
    lead_source text,
    lead_status text,
    lead_score integer,
    preferred_contact_method text,
    email_opt_in boolean DEFAULT true,
    sms_opt_in boolean DEFAULT false,
    notes text,
    last_contacted_date timestamp,
    next_follow_up_date timestamp,
    linkedin_url text,
    twitter_handle text,
    status text DEFAULT 'active' NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Contact Tags table
CREATE TABLE contact_tags (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    color text DEFAULT '#3B82F6',
    created_at timestamp DEFAULT now() NOT NULL
);

-- Contact Tag Assignments table
CREATE TABLE contact_tag_assignments (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id varchar NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    tag_id varchar NOT NULL REFERENCES contact_tags(id) ON DELETE CASCADE,
    created_at timestamp DEFAULT now() NOT NULL
);

-- Contact Activities table
CREATE TABLE contact_activities (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id varchar NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type text NOT NULL,
    subject text,
    description text,
    outcome text,
    user_id varchar REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamp DEFAULT now() NOT NULL
);

-- Prayer Settings table
CREATE TABLE prayer_settings (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    city text NOT NULL,
    country text NOT NULL,
    latitude numeric(10, 7),
    longitude numeric(10, 7),
    calculation_method integer DEFAULT 2 NOT NULL,
    timezone text NOT NULL,
    cached_prayer_times jsonb DEFAULT '{}',
    last_fetched timestamp,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Prayer Requests table
CREATE TABLE prayer_requests (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    submitter_name text,
    submitter_email text,
    is_anonymous boolean DEFAULT false,
    request_text text NOT NULL,
    category text,
    status text DEFAULT 'pending' NOT NULL,
    moderation_status text DEFAULT 'pending' NOT NULL,
    moderation_notes text,
    reviewed_by varchar,
    reviewed_at timestamp,
    ai_suggestions jsonb DEFAULT '{}',
    is_public boolean DEFAULT true,
    is_pinned boolean DEFAULT false,
    prayer_count integer DEFAULT 0 NOT NULL,
    is_answered boolean DEFAULT false,
    answered_at timestamp,
    answered_note text,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Landing Pages table
CREATE TABLE landing_pages (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    slug text NOT NULL UNIQUE,
    title text NOT NULL,
    description text,
    hero_image_url text,
    banner_image_url text,
    about_us text,
    page_components jsonb DEFAULT '[]' NOT NULL,
    settings jsonb DEFAULT '{"primaryColor":"#00BCD4","secondaryColor":"#FF5722","fontFamily":"Inter","showCampaigns":true,"showEvents":true,"showLivestreams":true,"showDonations":true,"showPrayerTimes":false,"showSermons":false,"showVolunteers":false,"showChatbot":true,"moduleOrder":["campaigns","events","livestreams","donations","prayerTimes","sermons","volunteers"]}' NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    published_at timestamp,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Email Templates table
CREATE TABLE email_templates (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    template_type text,
    subject text NOT NULL,
    preview_text text,
    html_body text,
    text_body text,
    blocks jsonb DEFAULT '[]',
    thumbnail_url text,
    donation_type text,
    min_amount numeric(10, 2),
    max_amount numeric(10, 2),
    priority integer DEFAULT 0 NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Sermon Categories table
CREATE TABLE sermon_categories (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    created_at timestamp DEFAULT now() NOT NULL
);

-- Sermon Tags table
CREATE TABLE sermon_tags (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    slug text NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL
);

-- Sermons table
CREATE TABLE sermons (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    speaker text NOT NULL,
    sermon_date timestamp NOT NULL,
    category_id varchar REFERENCES sermon_categories(id) ON DELETE SET NULL,
    video_url text,
    audio_url text,
    notes_url text,
    thumbnail_url text,
    platform text,
    platform_video_id text,
    duration integer,
    views integer DEFAULT 0 NOT NULL,
    scripture text[],
    ai_summary text,
    ai_notes text,
    search_embedding text,
    status text DEFAULT 'published' NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Sermon Tag Assignments table
CREATE TABLE sermon_tag_assignments (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    sermon_id varchar NOT NULL REFERENCES sermons(id) ON DELETE CASCADE,
    tag_id varchar NOT NULL REFERENCES sermon_tags(id) ON DELETE CASCADE,
    created_at timestamp DEFAULT now() NOT NULL
);

-- Volunteers table
CREATE TABLE volunteers (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text,
    date_of_birth timestamp,
    street text,
    city text,
    state text,
    zip text,
    country text,
    photo_url text,
    bio text,
    skills text[] DEFAULT '{}',
    interests text[] DEFAULT '{}',
    availability jsonb DEFAULT '{}',
    preferred_roles text[] DEFAULT '{}',
    team text,
    status text DEFAULT 'active' NOT NULL,
    total_hours integer DEFAULT 0 NOT NULL,
    shift_count integer DEFAULT 0 NOT NULL,
    start_date timestamp,
    emergency_contact_name text,
    emergency_contact_phone text,
    emergency_contact_relationship text,
    notes text,
    background_check_status text,
    background_check_date timestamp,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Volunteer Shifts table
CREATE TABLE volunteer_shifts (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    volunteer_id varchar NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
    event_id varchar REFERENCES events(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    location text,
    shift_date timestamp NOT NULL,
    start_time text NOT NULL,
    end_time text NOT NULL,
    role text,
    team text,
    status text DEFAULT 'scheduled' NOT NULL,
    reminder_sent boolean DEFAULT false NOT NULL,
    reminder_sent_at timestamp,
    notes text,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Volunteer Hours table
CREATE TABLE volunteer_hours (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    volunteer_id varchar NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
    shift_id varchar REFERENCES volunteer_shifts(id) ON DELETE SET NULL,
    date timestamp NOT NULL,
    hours_worked numeric(5, 2) NOT NULL,
    activity text NOT NULL,
    description text,
    status text DEFAULT 'pending' NOT NULL,
    approved_by varchar,
    approved_at timestamp,
    notes text,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Beneficiaries table
CREATE TABLE beneficiaries (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type text NOT NULL,
    first_name text,
    last_name text,
    organization_name text,
    date_of_birth timestamp,
    gender text,
    email text,
    phone text,
    street text,
    city text,
    state text,
    zip text,
    country text,
    photo_url text,
    biography text,
    occupation text,
    education text,
    languages jsonb DEFAULT '[]',
    health_status text,
    medical_conditions jsonb DEFAULT '[]',
    disabilities text,
    medications jsonb DEFAULT '[]',
    allergies jsonb DEFAULT '[]',
    last_medical_checkup timestamp,
    primary_needs jsonb DEFAULT '[]',
    urgency_level text DEFAULT 'medium' NOT NULL,
    housing_status text,
    employment_status text,
    monthly_income numeric(12, 2),
    number_of_dependents integer DEFAULT 0,
    total_donations_received numeric(12, 2) DEFAULT '0' NOT NULL,
    total_gifts_received integer DEFAULT 0 NOT NULL,
    first_support_date timestamp,
    last_support_date timestamp,
    status text DEFAULT 'active' NOT NULL,
    case_manager text,
    referral_source text,
    tags jsonb DEFAULT '[]',
    internal_notes text,
    public_notes text,
    verification_status text DEFAULT 'pending' NOT NULL,
    verified_at timestamp,
    verified_by varchar,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Beneficiary Donations table
CREATE TABLE beneficiary_donations (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    beneficiary_id varchar NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
    donation_id varchar REFERENCES donations(id) ON DELETE SET NULL,
    donation_type text NOT NULL,
    amount numeric(12, 2),
    currency text DEFAULT 'USD',
    description text NOT NULL,
    quantity integer,
    delivery_date timestamp NOT NULL,
    delivery_method text,
    delivered_by text,
    receipt_url text,
    impact_notes text,
    follow_up_required boolean DEFAULT false,
    follow_up_date timestamp,
    status text DEFAULT 'completed' NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Beneficiary Communications table
CREATE TABLE beneficiary_communications (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    beneficiary_id varchar NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
    type text NOT NULL,
    subject text,
    content text NOT NULL,
    direction text,
    communication_date timestamp DEFAULT now() NOT NULL,
    staff_member text,
    attachments jsonb DEFAULT '[]',
    requires_follow_up boolean DEFAULT false,
    follow_up_date timestamp,
    follow_up_completed boolean DEFAULT false,
    tags jsonb DEFAULT '[]',
    priority text DEFAULT 'normal',
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Activities table
CREATE TABLE activities (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    image_url text,
    category text,
    tags jsonb,
    teacher_name text,
    teacher_id varchar,
    teacher_bio text,
    teacher_image_url text,
    is_free boolean DEFAULT true NOT NULL,
    price numeric(10, 2) DEFAULT '0' NOT NULL,
    currency text DEFAULT 'USD',
    max_students integer,
    current_students integer DEFAULT 0 NOT NULL,
    allow_waitlist boolean DEFAULT false NOT NULL,
    schedule_type text DEFAULT 'weekly' NOT NULL,
    start_date timestamp,
    end_date timestamp,
    status text DEFAULT 'draft' NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    requires_approval boolean DEFAULT false NOT NULL,
    settings jsonb,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Activity Sessions table
CREATE TABLE activity_sessions (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id varchar NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    session_date timestamp NOT NULL,
    start_time text NOT NULL,
    end_time text NOT NULL,
    location text,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Activity Registrations table
CREATE TABLE activity_registrations (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id varchar NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    student_name text NOT NULL,
    student_email text NOT NULL,
    student_phone text,
    parent_name text,
    parent_email text,
    parent_phone text,
    status text DEFAULT 'confirmed' NOT NULL,
    stripe_payment_id text,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Activity Attendance table
CREATE TABLE activity_attendance (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id varchar NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    registration_id varchar NOT NULL REFERENCES activity_registrations(id) ON DELETE CASCADE,
    session_date timestamp NOT NULL,
    attended boolean DEFAULT false NOT NULL,
    notes text,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Member Tags table
CREATE TABLE member_tags (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    color text DEFAULT '#3B82F6',
    created_at timestamp DEFAULT now() NOT NULL
);

-- Member Tag Assignments table
CREATE TABLE member_tag_assignments (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    member_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tag_id varchar NOT NULL REFERENCES member_tags(id) ON DELETE CASCADE,
    assigned_at timestamp DEFAULT now() NOT NULL
);

-- Email Campaigns table
CREATE TABLE email_campaigns (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id varchar NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    template_id varchar REFERENCES email_templates(id) ON DELETE SET NULL,
    name text NOT NULL,
    subject text NOT NULL,
    preview_text text,
    blocks jsonb DEFAULT '[]' NOT NULL,
    recipient_type text NOT NULL,
    recipient_tags jsonb DEFAULT '[]',
    recipient_emails jsonb DEFAULT '[]',
    status text DEFAULT 'draft' NOT NULL,
    scheduled_for timestamp,
    sent_at timestamp,
    total_recipients integer DEFAULT 0 NOT NULL,
    sent_count integer DEFAULT 0 NOT NULL,
    delivered_count integer DEFAULT 0 NOT NULL,
    opened_count integer DEFAULT 0 NOT NULL,
    clicked_count integer DEFAULT 0 NOT NULL,
    bounced_count integer DEFAULT 0 NOT NULL,
    unsubscribed_count integer DEFAULT 0 NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Email Recipients table
CREATE TABLE email_recipients (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id varchar NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
    email text NOT NULL,
    first_name text,
    last_name text,
    status text DEFAULT 'pending' NOT NULL,
    resend_email_id text,
    unsubscribe_token text NOT NULL,
    sent_at timestamp,
    delivered_at timestamp,
    opened_at timestamp,
    clicked_at timestamp,
    bounced_at timestamp,
    unsubscribed_at timestamp,
    error_message text,
    created_at timestamp DEFAULT now() NOT NULL
);

-- Email Events table
CREATE TABLE email_events (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id varchar REFERENCES email_campaigns(id) ON DELETE CASCADE,
    recipient_id varchar REFERENCES email_recipients(id) ON DELETE CASCADE,
    resend_email_id text,
    event_type text NOT NULL,
    email text,
    metadata jsonb DEFAULT '{}',
    timestamp timestamp DEFAULT now() NOT NULL
);

