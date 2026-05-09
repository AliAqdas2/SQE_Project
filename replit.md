# Plegit 2.0 - Faith-Based Fundraising Platform

## Overview
Plegit is a PWA-first fundraising platform designed for faith-based organizations. Its primary goal is to streamline fundraising, manage donations, campaigns, and events efficiently, and foster community engagement. Key capabilities include instant QR code donations, AI-assisted campaign management, donor relationship management, multi-currency event ticketing with check-in, Livestream Giving, and a modular marketplace. The platform aims to provide modern digital tools for enhanced community interaction and simplified donation processes.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX
The frontend is built using React 18, TypeScript, Vite, Wouter, shadcn/ui (Radix UI), and Tailwind CSS. It supports both light and dark modes, and aims for a clean, intuitive, PWA-enabled user experience, drawing inspiration from platforms like Stripe, GoFundMe, Notion, and Linear.

### Technical Implementation
The backend is developed with Express.js, TypeScript, and Node.js, utilizing a RESTful, multi-tenant architecture. Core features include:
-   **Campaign Management**: CRUD operations with AI-powered content generation and a registry-driven page builder.
-   **Peer-to-Peer (P2P) Fundraising**: Manages participants, invitations, milestone tracking, gamification, leaderboards, chat, and document sharing.
-   **Events Management**: Supports various event types with AI-powered descriptions, multi-currency options, QR code check-in, and ticketing, including speaker and sponsor management.
-   **Livestream Giving**: Integrates real-time donations with streaming platforms.
-   **Modular Marketplace**: Allows organizations to activate features like Events, Livestream, Analytics, QR Donations, and Prayer Timetable.
-   **Donations Module**: Manages donation journals, receipt uploads, automated thank-you emails, and religion-based categorization with idempotency.
-   **Donors & Contacts Modules**: CRM functionalities for managing profiles, tagging, and tracking interactions.
-   **AI Chatbot**: Provides organization-specific answers on public landing pages, powered by GPT-5.
-   **Sermon & Media Library**: Manages sermons with AI-powered search and multi-platform video integration.
-   **Volunteer & Beneficiaries Management**: Tools for coordinating volunteers, tracking hours, and managing beneficiaries.
-   **Activities Management**: Manages classes and courses with scheduling and attendance tracking.
-   **Landing Page Customization**: Enables customization of public landing pages.
-   **Whitelabeling**: Organization logo and brand color customization that displays across dashboard sidebar, public landing page, volunteer portal, and onboarding. Settings available in Dashboard > Settings > General.
-   **Subscription & Billing System**: Implements a freemium model with multi-currency support and Stripe integration for secure transactions and subscription management.
-   **Stripe Connect Integration**: Organizations can connect their Stripe accounts via OAuth 2.0 for direct donation reception.
-   **Email Template System**: Provides customizable, placeholder-driven email templates for thank-yous and ticket confirmations.
-   **Analytics Dashboard**: Offers a customizable dashboard with 7 widgets for key metrics across modules, featuring date range filters and widget customization. Users can toggle widgets on/off with instant UI updates and persistent preferences across sessions.

### System Design
-   **Data Layer**: PostgreSQL (local or remote) with Drizzle ORM using node-postgres (pg).
-   **Schema**: Multi-tenant model with `organizations` as the root entity.
-   **Authentication & Security**: Dual portal architecture with audience-based access control via server-side middleware and frontend guards.

## External Dependencies
-   **Payment Gateway**: Stripe API (including Stripe Connect)
-   **Database Service**: PostgreSQL (local or remote)
-   **AI Services**: OpenAI API (direct integration)
-   **Prayer Times API**: AlAdhan API
-   **Email Service**: Resend API (direct integration)
-   **Object Storage**: Google Cloud Storage (direct integration)
-   **Font Delivery**: Google Fonts

## Environment Variables

The following environment variables are required:

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `RESEND_API_KEY` - Resend API key for email service
- `RESEND_FROM_EMAIL` - Default sender email address (optional, defaults to noreply@plegit.app)
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `BASE_URL` or `APP_URL` - Base URL of the application (e.g., https://plegit.app)

### Google Cloud Storage (Object Storage)
One of the following is required:
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to Google Cloud service account JSON key file, OR
- `GOOGLE_CLOUD_CREDENTIALS` - JSON string of Google Cloud service account credentials

Additionally:
- `GOOGLE_CLOUD_PROJECT_ID` - Google Cloud project ID (optional)
- `PRIVATE_OBJECT_DIR` or `GOOGLE_CLOUD_STORAGE_BUCKET` - Storage bucket path in format `/bucket-name/path/to/directory`