CREATE TABLE "activities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"teacher" text,
	"is_paid" boolean DEFAULT false NOT NULL,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'USD',
	"max_students" integer,
	"current_students" integer DEFAULT 0 NOT NULL,
	"schedule_type" text DEFAULT 'weekly' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_attendance" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" varchar NOT NULL,
	"org_id" varchar NOT NULL,
	"registration_id" varchar NOT NULL,
	"session_date" timestamp NOT NULL,
	"attended" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_registrations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" varchar NOT NULL,
	"org_id" varchar NOT NULL,
	"student_name" text NOT NULL,
	"student_email" text NOT NULL,
	"student_phone" text,
	"parent_name" text,
	"parent_email" text,
	"parent_phone" text,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"stripe_payment_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" varchar NOT NULL,
	"org_id" varchar NOT NULL,
	"session_date" timestamp NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"location" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token" text NOT NULL,
	"type" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "auth_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "beneficiaries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"type" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"organization_name" text,
	"date_of_birth" timestamp,
	"gender" text,
	"email" text,
	"phone" text,
	"street" text,
	"city" text,
	"state" text,
	"zip" text,
	"country" text,
	"photo_url" text,
	"biography" text,
	"occupation" text,
	"education" text,
	"languages" jsonb DEFAULT '[]'::jsonb,
	"health_status" text,
	"medical_conditions" jsonb DEFAULT '[]'::jsonb,
	"disabilities" text,
	"medications" jsonb DEFAULT '[]'::jsonb,
	"allergies" jsonb DEFAULT '[]'::jsonb,
	"last_medical_checkup" timestamp,
	"primary_needs" jsonb DEFAULT '[]'::jsonb,
	"urgency_level" text DEFAULT 'medium' NOT NULL,
	"housing_status" text,
	"employment_status" text,
	"monthly_income" numeric(12, 2),
	"number_of_dependents" integer DEFAULT 0,
	"total_donations_received" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_gifts_received" integer DEFAULT 0 NOT NULL,
	"first_support_date" timestamp,
	"last_support_date" timestamp,
	"status" text DEFAULT 'active' NOT NULL,
	"case_manager" text,
	"referral_source" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"internal_notes" text,
	"public_notes" text,
	"verification_status" text DEFAULT 'pending' NOT NULL,
	"verified_at" timestamp,
	"verified_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "beneficiary_communications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"beneficiary_id" varchar NOT NULL,
	"type" text NOT NULL,
	"subject" text,
	"content" text NOT NULL,
	"direction" text,
	"communication_date" timestamp DEFAULT now() NOT NULL,
	"staff_member" text,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"requires_follow_up" boolean DEFAULT false,
	"follow_up_date" timestamp,
	"follow_up_completed" boolean DEFAULT false,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"priority" text DEFAULT 'normal',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "beneficiary_donations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"beneficiary_id" varchar NOT NULL,
	"donation_id" varchar,
	"donation_type" text NOT NULL,
	"amount" numeric(12, 2),
	"currency" text DEFAULT 'USD',
	"description" text NOT NULL,
	"quantity" integer,
	"delivery_date" timestamp NOT NULL,
	"delivery_method" text,
	"delivered_by" text,
	"receipt_url" text,
	"impact_notes" text,
	"follow_up_required" boolean DEFAULT false,
	"follow_up_date" timestamp,
	"status" text DEFAULT 'completed' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" varchar NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_expenses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" varchar NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"category" text NOT NULL,
	"date" timestamp NOT NULL,
	"receipt_url" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_strategies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" varchar NOT NULL,
	"org_id" varchar NOT NULL,
	"content" jsonb NOT NULL,
	"summary" text,
	"insights" jsonb,
	"model" text DEFAULT 'gpt-4o' NOT NULL,
	"generated_by" varchar,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_updates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" varchar NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"image_url" text,
	"show_on_public_page" boolean DEFAULT false NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image_url" text,
	"goal_amount" numeric(12, 2) NOT NULL,
	"current_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"category" text,
	"status" text DEFAULT 'active' NOT NULL,
	"country" text,
	"currency" text DEFAULT 'USD' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"quick_donation_buttons" jsonb DEFAULT '[]'::jsonb,
	"page_components" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_activities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" varchar NOT NULL,
	"org_id" varchar NOT NULL,
	"type" text NOT NULL,
	"subject" text,
	"description" text,
	"outcome" text,
	"user_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_tag_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" varchar NOT NULL,
	"tag_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_tags" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#3B82F6',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"street" text,
	"city" text,
	"state" text,
	"zip" text,
	"country" text,
	"company" text,
	"job_title" text,
	"types" text[] DEFAULT '{}' NOT NULL,
	"total_donated" numeric(12, 2) DEFAULT '0',
	"donation_count" integer DEFAULT 0,
	"last_donation_date" timestamp,
	"donor_tier" text,
	"skills" text[] DEFAULT '{}',
	"availability" text,
	"hours_contributed" integer DEFAULT 0,
	"volunteer_status" text,
	"sponsorship_level" text,
	"sponsorship_amount" numeric(12, 2),
	"contract_start_date" timestamp,
	"contract_end_date" timestamp,
	"lead_source" text,
	"lead_status" text,
	"lead_score" integer,
	"preferred_contact_method" text,
	"email_opt_in" boolean DEFAULT true,
	"sms_opt_in" boolean DEFAULT false,
	"notes" text,
	"last_contacted_date" timestamp,
	"next_follow_up_date" timestamp,
	"linkedin_url" text,
	"twitter_handle" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "country_pricing" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_code" text NOT NULL,
	"currency" text NOT NULL,
	"tier_code" text NOT NULL,
	"monthly_price" numeric(10, 2) NOT NULL,
	"yearly_price" numeric(10, 2) NOT NULL,
	"vat_rate" numeric(5, 2) DEFAULT '0',
	"rounding_rule" text DEFAULT 'none',
	"stripe_monthly_price_id" text,
	"stripe_yearly_price_id" text,
	"created_by_admin_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "country_pricing_country_code_tier_code_unique" UNIQUE("country_code","tier_code")
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"campaign_id" varchar,
	"event_id" varchar,
	"livestream_id" varchar,
	"donor_id" varchar,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"donation_type" text DEFAULT 'online' NOT NULL,
	"category" text,
	"cover_fees" boolean DEFAULT false,
	"fee_amount" numeric(12, 2) DEFAULT '0',
	"recurring" boolean DEFAULT false NOT NULL,
	"frequency" text,
	"stripe_subscription_id" text,
	"payment_method" text,
	"stripe_payment_id" text,
	"status" text DEFAULT 'completed' NOT NULL,
	"donor_email" text,
	"donor_name" text,
	"message" text,
	"receipt_url" text,
	"thank_you_sent" boolean DEFAULT false NOT NULL,
	"thank_you_sent_at" timestamp,
	"notes" text,
	"gift_aid_opt_in" boolean DEFAULT false NOT NULL,
	"gift_aid_eligible" boolean DEFAULT false NOT NULL,
	"donor_address" text,
	"donor_city" text,
	"donor_postcode" text,
	"donor_country" text,
	"tax_relief_amount" numeric(12, 2),
	"tax_relief_claimed" boolean DEFAULT false NOT NULL,
	"tax_relief_claimed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donor_tag_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"donor_id" varchar NOT NULL,
	"tag_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donor_tags" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#3B82F6',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donors" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"total_donated" numeric(12, 2) DEFAULT '0' NOT NULL,
	"donation_count" integer DEFAULT 0 NOT NULL,
	"tier" text DEFAULT 'bronze',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_campaigns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"template_id" varchar,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"preview_text" text,
	"blocks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recipient_type" text NOT NULL,
	"recipient_tags" jsonb DEFAULT '[]'::jsonb,
	"recipient_emails" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"scheduled_for" timestamp,
	"sent_at" timestamp,
	"total_recipients" integer DEFAULT 0 NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"delivered_count" integer DEFAULT 0 NOT NULL,
	"opened_count" integer DEFAULT 0 NOT NULL,
	"clicked_count" integer DEFAULT 0 NOT NULL,
	"bounced_count" integer DEFAULT 0 NOT NULL,
	"unsubscribed_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" varchar,
	"recipient_id" varchar,
	"resend_email_id" text,
	"event_type" text NOT NULL,
	"email" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_recipients" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" varchar NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"resend_email_id" text,
	"unsubscribe_token" text NOT NULL,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"bounced_at" timestamp,
	"unsubscribed_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"name" text NOT NULL,
	"template_type" text,
	"subject" text NOT NULL,
	"preview_text" text,
	"html_body" text,
	"text_body" text,
	"blocks" jsonb DEFAULT '[]'::jsonb,
	"thumbnail_url" text,
	"donation_type" text,
	"min_amount" numeric(10, 2),
	"max_amount" numeric(10, 2),
	"priority" integer DEFAULT 0 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_promo_codes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar NOT NULL,
	"code" text NOT NULL,
	"discount_type" text NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"max_uses" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"valid_from" timestamp,
	"valid_until" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_registrations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar NOT NULL,
	"ticket_type_id" varchar,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"ticket_count" integer DEFAULT 1 NOT NULL,
	"total_paid" numeric(10, 2) NOT NULL,
	"donation_amount" numeric(10, 2) DEFAULT '0',
	"donation_category" text,
	"promo_code" text,
	"qr_code" text NOT NULL,
	"checked_in" boolean DEFAULT false NOT NULL,
	"checked_in_at" timestamp,
	"stripe_payment_id" text,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_ticket_types" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"quantity" integer NOT NULL,
	"sold" integer DEFAULT 0 NOT NULL,
	"min_per_order" integer DEFAULT 1 NOT NULL,
	"max_per_order" integer DEFAULT 10 NOT NULL,
	"sales_start" timestamp,
	"sales_end" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_waitlist" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"tickets_requested" integer DEFAULT 1 NOT NULL,
	"notified" boolean DEFAULT false NOT NULL,
	"notified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image_url" text,
	"category" text,
	"tags" text[],
	"event_type" text DEFAULT 'in-person' NOT NULL,
	"date" timestamp NOT NULL,
	"time" text NOT NULL,
	"end_time" text,
	"location" text NOT NULL,
	"livestream_url" text,
	"capacity" integer NOT NULL,
	"attendee_count" integer DEFAULT 0 NOT NULL,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"allow_donations" boolean DEFAULT false NOT NULL,
	"seating_map_url" text,
	"enable_waitlist" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurring_pattern" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "landing_pages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"hero_image_url" text,
	"banner_image_url" text,
	"about_us" text,
	"page_components" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"settings" jsonb DEFAULT '{"primaryColor":"#00BCD4","secondaryColor":"#FF5722","fontFamily":"Inter","showCampaigns":true,"showEvents":true,"showLivestreams":true,"showDonations":true,"showPrayerTimes":false,"showSermons":false,"showVolunteers":false,"showChatbot":true,"moduleOrder":["campaigns","events","livestreams","donations","prayerTimes","sermons","volunteers"]}'::jsonb NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "landing_pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "livestream_access" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"livestream_id" varchar NOT NULL,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"access_token" text NOT NULL,
	"stripe_payment_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "livestream_access_access_token_unique" UNIQUE("access_token")
);
--> statement-breakpoint
CREATE TABLE "livestream_chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"livestream_id" varchar NOT NULL,
	"donor_id" varchar,
	"donor_name" text NOT NULL,
	"message" text NOT NULL,
	"is_donor" boolean DEFAULT false NOT NULL,
	"donor_badge" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "livestream_donations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"livestream_id" varchar NOT NULL,
	"org_id" varchar NOT NULL,
	"donor_id" varchar,
	"donor_name" text NOT NULL,
	"donor_email" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"category" text,
	"message" text,
	"show_name" boolean DEFAULT true NOT NULL,
	"show_amount" boolean DEFAULT true NOT NULL,
	"highlighted" boolean DEFAULT false NOT NULL,
	"stripe_payment_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "livestreams" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"campaign_id" varchar,
	"title" text NOT NULL,
	"description" text,
	"thumbnail_url" text,
	"platform" text NOT NULL,
	"video_id" text,
	"embed_url" text,
	"chat_url" text,
	"scheduled_start" timestamp NOT NULL,
	"scheduled_end" timestamp,
	"actual_start" timestamp,
	"actual_end" timestamp,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"total_raised" numeric(12, 2) DEFAULT '0' NOT NULL,
	"donor_count" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"is_paid" boolean DEFAULT false NOT NULL,
	"ticket_price" numeric(10, 2) DEFAULT '0',
	"currency" text DEFAULT 'USD' NOT NULL,
	"replay_available" boolean DEFAULT true NOT NULL,
	"ai_insights" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_modules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_key" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "marketplace_modules_module_key_unique" UNIQUE("module_key")
);
--> statement-breakpoint
CREATE TABLE "member_tag_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"member_id" varchar NOT NULL,
	"tag_id" varchar NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_tags" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#3B82F6',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "module_pricing" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" varchar NOT NULL,
	"country" text NOT NULL,
	"currency" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"billing_period" text DEFAULT 'monthly' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_modules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"module_id" varchar NOT NULL,
	"enabled_at" timestamp DEFAULT now() NOT NULL,
	"enabled_by" varchar,
	"status" text DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_registrations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"charity_name" text NOT NULL,
	"contact_first_name" text,
	"contact_last_name" text,
	"contact_email" text,
	"contact_phone" text,
	"street" text,
	"city" text,
	"state" text,
	"zip" text,
	"country" text,
	"timezone" text,
	"currency" text,
	"date_format" text,
	"incorporation_doc_url" text,
	"current_step" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp,
	"reviewed_at" timestamp,
	"reviewed_by" varchar,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"plan_id" varchar NOT NULL,
	"billing_cycle" text NOT NULL,
	"member_count" integer DEFAULT 0 NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"status" text NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"canceled_at" timestamp,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"auto_upgrade_queued" boolean DEFAULT false NOT NULL,
	"last_renewal_reminder_sent_at" timestamp,
	"last_renewal_reminder_for_period_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_subscriptions_org_id_unique" UNIQUE("org_id"),
	CONSTRAINT "organization_subscriptions_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "organization_subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"logo_url" text,
	"primary_color" text DEFAULT '#00BCD4',
	"religion" text,
	"street" text,
	"city" text,
	"state" text,
	"zip" text,
	"country" text,
	"timezone" text DEFAULT 'America/New_York',
	"currency" text DEFAULT 'USD',
	"date_format" text DEFAULT 'MM/DD/YYYY',
	"stripe_customer_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_at" timestamp,
	"approved_by" varchar,
	"incorporation_doc_url" text,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug"),
	CONSTRAINT "organizations_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "p2p_campaign_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" varchar NOT NULL,
	"org_id" varchar NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"require_approval" boolean DEFAULT false NOT NULL,
	"default_participant_goal" numeric(12, 2),
	"welcome_message" text,
	"participant_instructions" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "p2p_campaign_settings_campaign_id_unique" UNIQUE("campaign_id")
);
--> statement-breakpoint
CREATE TABLE "p2p_chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" varchar NOT NULL,
	"participant_id" varchar,
	"sender_name" text NOT NULL,
	"sender_role" text DEFAULT 'participant' NOT NULL,
	"message" text NOT NULL,
	"attachment_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "p2p_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" varchar NOT NULL,
	"org_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"file_url" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer,
	"file_type" text,
	"category" text,
	"access_scope" text DEFAULT 'all_participants' NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp,
	"uploaded_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "p2p_gamification_badges" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" varchar,
	"org_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"icon" text NOT NULL,
	"badge_type" text NOT NULL,
	"threshold" numeric(12, 2),
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "p2p_invitations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" varchar NOT NULL,
	"invited_by" varchar,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "p2p_invitations_token_unique" UNIQUE("token"),
	CONSTRAINT "p2p_invitations_campaign_id_email_unique" UNIQUE("campaign_id","email")
);
--> statement-breakpoint
CREATE TABLE "p2p_milestones" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"trigger_type" text NOT NULL,
	"trigger_value" numeric(12, 2) NOT NULL,
	"email_subject" text,
	"email_body" text,
	"badge_icon" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "p2p_participant_badges" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" varchar NOT NULL,
	"badge_id" varchar NOT NULL,
	"awarded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "p2p_participant_milestones" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" varchar NOT NULL,
	"milestone_id" varchar NOT NULL,
	"progress" numeric(5, 2) DEFAULT '0' NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"email_sent" boolean DEFAULT false NOT NULL,
	"email_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "p2p_participants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" varchar NOT NULL,
	"org_id" varchar NOT NULL,
	"donor_id" varchar,
	"user_id" varchar,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"slug" text NOT NULL,
	"avatar_url" text,
	"bio" text,
	"goal_amount" numeric(12, 2) NOT NULL,
	"raised_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"donation_count" integer DEFAULT 0 NOT NULL,
	"role" text DEFAULT 'participant' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"deleted_at" timestamp,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"last_active" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "p2p_participants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"contact_person" text,
	"phone" text,
	"country" text,
	"commission_rate" numeric(5, 2) DEFAULT '10.00' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"total_referrals" integer DEFAULT 0 NOT NULL,
	"total_revenue" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "partners_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "prayer_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"submitter_name" text,
	"submitter_email" text,
	"is_anonymous" boolean DEFAULT false,
	"request_text" text NOT NULL,
	"category" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"moderation_status" text DEFAULT 'pending' NOT NULL,
	"moderation_notes" text,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"ai_suggestions" jsonb DEFAULT '{}'::jsonb,
	"is_public" boolean DEFAULT true,
	"is_pinned" boolean DEFAULT false,
	"prayer_count" integer DEFAULT 0 NOT NULL,
	"is_answered" boolean DEFAULT false,
	"answered_at" timestamp,
	"answered_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prayer_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"city" text NOT NULL,
	"country" text NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"calculation_method" integer DEFAULT 2 NOT NULL,
	"timezone" text NOT NULL,
	"cached_prayer_times" jsonb DEFAULT '{}'::jsonb,
	"last_fetched" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "prayer_settings_org_id_unique" UNIQUE("org_id")
);
--> statement-breakpoint
CREATE TABLE "referral_codes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" varchar NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referral_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "sermon_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sermon_tag_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sermon_id" varchar NOT NULL,
	"tag_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sermon_tags" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sermons" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"speaker" text NOT NULL,
	"sermon_date" timestamp NOT NULL,
	"category_id" varchar,
	"video_url" text,
	"audio_url" text,
	"notes_url" text,
	"thumbnail_url" text,
	"platform" text,
	"platform_video_id" text,
	"duration" integer,
	"views" integer DEFAULT 0 NOT NULL,
	"scripture" text[],
	"ai_summary" text,
	"ai_notes" text,
	"search_embedding" text,
	"status" text DEFAULT 'published' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"subscription_id" varchar NOT NULL,
	"type" text NOT NULL,
	"tier_code" text,
	"module_id" varchar,
	"stripe_price_id" text NOT NULL,
	"stripe_subscription_item_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_items_stripe_subscription_item_id_unique" UNIQUE("stripe_subscription_item_id")
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tier_code" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"min_members" integer NOT NULL,
	"max_members" integer,
	"base_monthly_price" numeric(10, 2) NOT NULL,
	"base_yearly_price" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'GBP' NOT NULL,
	"stripe_monthly_price_id" text,
	"stripe_yearly_price_id" text,
	"stripe_product_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_plans_tier_code_unique" UNIQUE("tier_code")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"module_id" varchar NOT NULL,
	"stripe_subscription_id" text,
	"stripe_customer_id" text,
	"status" text NOT NULL,
	"billing_period" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"canceled_at" timestamp,
	"referral_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar,
	"email" text NOT NULL,
	"password_hash" text,
	"password_set_at" timestamp,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"role" text DEFAULT 'org_admin' NOT NULL,
	"email_opted_out" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "volunteer_hours" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"volunteer_id" varchar NOT NULL,
	"shift_id" varchar,
	"date" timestamp NOT NULL,
	"hours_worked" numeric(5, 2) NOT NULL,
	"activity" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_by" varchar,
	"approved_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "volunteer_shifts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"volunteer_id" varchar NOT NULL,
	"event_id" varchar,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"shift_date" timestamp NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"role" text,
	"team" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"reminder_sent" boolean DEFAULT false NOT NULL,
	"reminder_sent_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "volunteers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" varchar NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"date_of_birth" timestamp,
	"street" text,
	"city" text,
	"state" text,
	"zip" text,
	"country" text,
	"photo_url" text,
	"bio" text,
	"skills" text[] DEFAULT '{}',
	"interests" text[] DEFAULT '{}',
	"availability" jsonb DEFAULT '{}'::jsonb,
	"preferred_roles" text[] DEFAULT '{}',
	"team" text,
	"status" text DEFAULT 'active' NOT NULL,
	"total_hours" integer DEFAULT 0 NOT NULL,
	"shift_count" integer DEFAULT 0 NOT NULL,
	"start_date" timestamp,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"emergency_contact_relationship" text,
	"notes" text,
	"background_check_status" text,
	"background_check_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_attendance" ADD CONSTRAINT "activity_attendance_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_attendance" ADD CONSTRAINT "activity_attendance_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_attendance" ADD CONSTRAINT "activity_attendance_registration_id_activity_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."activity_registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_registrations" ADD CONSTRAINT "activity_registrations_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_registrations" ADD CONSTRAINT "activity_registrations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_sessions" ADD CONSTRAINT "activity_sessions_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_sessions" ADD CONSTRAINT "activity_sessions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beneficiary_communications" ADD CONSTRAINT "beneficiary_communications_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beneficiary_communications" ADD CONSTRAINT "beneficiary_communications_beneficiary_id_beneficiaries_id_fk" FOREIGN KEY ("beneficiary_id") REFERENCES "public"."beneficiaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beneficiary_donations" ADD CONSTRAINT "beneficiary_donations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beneficiary_donations" ADD CONSTRAINT "beneficiary_donations_beneficiary_id_beneficiaries_id_fk" FOREIGN KEY ("beneficiary_id") REFERENCES "public"."beneficiaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beneficiary_donations" ADD CONSTRAINT "beneficiary_donations_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_chat_messages" ADD CONSTRAINT "campaign_chat_messages_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_expenses" ADD CONSTRAINT "campaign_expenses_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_expenses" ADD CONSTRAINT "campaign_expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_strategies" ADD CONSTRAINT "campaign_strategies_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_strategies" ADD CONSTRAINT "campaign_strategies_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_strategies" ADD CONSTRAINT "campaign_strategies_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_updates" ADD CONSTRAINT "campaign_updates_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_updates" ADD CONSTRAINT "campaign_updates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_activities" ADD CONSTRAINT "contact_activities_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_activities" ADD CONSTRAINT "contact_activities_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_activities" ADD CONSTRAINT "contact_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_tag_assignments" ADD CONSTRAINT "contact_tag_assignments_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_tag_assignments" ADD CONSTRAINT "contact_tag_assignments_tag_id_contact_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."contact_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_tags" ADD CONSTRAINT "contact_tags_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "country_pricing" ADD CONSTRAINT "country_pricing_created_by_admin_id_users_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_livestream_id_livestreams_id_fk" FOREIGN KEY ("livestream_id") REFERENCES "public"."livestreams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_donor_id_donors_id_fk" FOREIGN KEY ("donor_id") REFERENCES "public"."donors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donor_tag_assignments" ADD CONSTRAINT "donor_tag_assignments_donor_id_donors_id_fk" FOREIGN KEY ("donor_id") REFERENCES "public"."donors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donor_tag_assignments" ADD CONSTRAINT "donor_tag_assignments_tag_id_donor_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."donor_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donor_tags" ADD CONSTRAINT "donor_tags_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donors" ADD CONSTRAINT "donors_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_campaign_id_email_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."email_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_recipient_id_email_recipients_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."email_recipients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_recipients" ADD CONSTRAINT "email_recipients_campaign_id_email_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."email_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_promo_codes" ADD CONSTRAINT "event_promo_codes_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_ticket_type_id_event_ticket_types_id_fk" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."event_ticket_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_ticket_types" ADD CONSTRAINT "event_ticket_types_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_waitlist" ADD CONSTRAINT "event_waitlist_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestream_access" ADD CONSTRAINT "livestream_access_livestream_id_livestreams_id_fk" FOREIGN KEY ("livestream_id") REFERENCES "public"."livestreams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestream_chat_messages" ADD CONSTRAINT "livestream_chat_messages_livestream_id_livestreams_id_fk" FOREIGN KEY ("livestream_id") REFERENCES "public"."livestreams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestream_chat_messages" ADD CONSTRAINT "livestream_chat_messages_donor_id_donors_id_fk" FOREIGN KEY ("donor_id") REFERENCES "public"."donors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestream_donations" ADD CONSTRAINT "livestream_donations_livestream_id_livestreams_id_fk" FOREIGN KEY ("livestream_id") REFERENCES "public"."livestreams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestream_donations" ADD CONSTRAINT "livestream_donations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestream_donations" ADD CONSTRAINT "livestream_donations_donor_id_donors_id_fk" FOREIGN KEY ("donor_id") REFERENCES "public"."donors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestreams" ADD CONSTRAINT "livestreams_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestreams" ADD CONSTRAINT "livestreams_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_tag_assignments" ADD CONSTRAINT "member_tag_assignments_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_tag_assignments" ADD CONSTRAINT "member_tag_assignments_member_id_users_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_tag_assignments" ADD CONSTRAINT "member_tag_assignments_tag_id_member_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."member_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_tags" ADD CONSTRAINT "member_tags_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_pricing" ADD CONSTRAINT "module_pricing_module_id_marketplace_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."marketplace_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_modules" ADD CONSTRAINT "organization_modules_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_modules" ADD CONSTRAINT "organization_modules_module_id_marketplace_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."marketplace_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_modules" ADD CONSTRAINT "organization_modules_enabled_by_users_id_fk" FOREIGN KEY ("enabled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_subscriptions" ADD CONSTRAINT "organization_subscriptions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_subscriptions" ADD CONSTRAINT "organization_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "p2p_campaign_settings" ADD CONSTRAINT "p2p_campaign_settings_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "p2p_campaign_settings" ADD CONSTRAINT "p2p_campaign_settings_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "p2p_chat_messages" ADD CONSTRAINT "p2p_chat_messages_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "p2p_chat_messages" ADD CONSTRAINT "p2p_chat_messages_participant_id_p2p_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."p2p_participants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "p2p_documents" ADD CONSTRAINT "p2p_documents_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "p2p_documents" ADD CONSTRAINT "p2p_documents_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "p2p_documents" ADD CONSTRAINT "p2p_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "p2p_gamification_badges" ADD CONSTRAINT "p2p_gamification_badges_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "p2p_gamification_badges" ADD CONSTRAINT "p2p_gamification_badges_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "p2p_invitations" ADD CONSTRAINT "p2p_invitations_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "p2p_invitations" ADD CONSTRAINT "p2p_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "p2p_milestones" ADD CONSTRAINT "p2p_milestones_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "p2p_participant_badges" ADD CONSTRAINT "p2p_participant_badges_participant_id_p2p_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."p2p_participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "p2p_participant_badges" ADD CONSTRAINT "p2p_participant_badges_badge_id_p2p_gamification_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."p2p_gamification_badges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "p2p_participant_milestones" ADD CONSTRAINT "p2p_participant_milestones_participant_id_p2p_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."p2p_participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "p2p_participant_milestones" ADD CONSTRAINT "p2p_participant_milestones_milestone_id_p2p_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."p2p_milestones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "p2p_participants" ADD CONSTRAINT "p2p_participants_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "p2p_participants" ADD CONSTRAINT "p2p_participants_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "p2p_participants" ADD CONSTRAINT "p2p_participants_donor_id_donors_id_fk" FOREIGN KEY ("donor_id") REFERENCES "public"."donors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "p2p_participants" ADD CONSTRAINT "p2p_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_requests" ADD CONSTRAINT "prayer_requests_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_settings" ADD CONSTRAINT "prayer_settings_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sermon_categories" ADD CONSTRAINT "sermon_categories_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sermon_tag_assignments" ADD CONSTRAINT "sermon_tag_assignments_sermon_id_sermons_id_fk" FOREIGN KEY ("sermon_id") REFERENCES "public"."sermons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sermon_tag_assignments" ADD CONSTRAINT "sermon_tag_assignments_tag_id_sermon_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."sermon_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sermon_tags" ADD CONSTRAINT "sermon_tags_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sermons" ADD CONSTRAINT "sermons_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sermons" ADD CONSTRAINT "sermons_category_id_sermon_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."sermon_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_items" ADD CONSTRAINT "subscription_items_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_items" ADD CONSTRAINT "subscription_items_subscription_id_organization_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."organization_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_items" ADD CONSTRAINT "subscription_items_module_id_marketplace_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."marketplace_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_module_id_marketplace_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."marketplace_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_referral_code_referral_codes_code_fk" FOREIGN KEY ("referral_code") REFERENCES "public"."referral_codes"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_hours" ADD CONSTRAINT "volunteer_hours_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_hours" ADD CONSTRAINT "volunteer_hours_volunteer_id_volunteers_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."volunteers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_hours" ADD CONSTRAINT "volunteer_hours_shift_id_volunteer_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."volunteer_shifts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_shifts" ADD CONSTRAINT "volunteer_shifts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_shifts" ADD CONSTRAINT "volunteer_shifts_volunteer_id_volunteers_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."volunteers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_shifts" ADD CONSTRAINT "volunteer_shifts_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteers" ADD CONSTRAINT "volunteers_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;