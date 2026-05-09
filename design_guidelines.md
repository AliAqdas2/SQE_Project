# Plegit 2.0 Design Guidelines

## Design Approach

**Reference-Based Approach** drawing inspiration from:
- **Stripe**: Clean, trustworthy payment flows with exceptional clarity
- **GoFundMe**: Emotional storytelling with campaign cards and progress visualization
- **Notion**: Organized data presentation for CRM and admin interfaces
- **Linear**: Sharp typography and refined spacing for modern SaaS feel

**Core Principle**: Build trust through clarity, simplicity, and purposeful design. Every interaction should feel secure, transparent, and inspiring.

---

## Typography System

**Primary Font**: Inter or DM Sans via Google Fonts
- **Headlines (H1)**: 3xl to 5xl, font-semibold to font-bold
- **Subheadings (H2-H3)**: xl to 2xl, font-semibold
- **Body Text**: base to lg, font-normal, leading-relaxed for readability
- **Small Text**: sm, font-medium for labels and metadata
- **CTA Text**: base to lg, font-semibold for buttons

**Secondary Font**: System serif (Georgia fallback) for testimonials and pull quotes

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 8, 12, 16, 24** consistently
- Component padding: p-4 to p-8
- Section spacing: py-12 to py-24 (mobile to desktop)
- Card gaps: gap-4 to gap-8
- Form field spacing: space-y-4

**Grid System**:
- Desktop: max-w-7xl container with 12-column grid
- Cards/Features: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Dashboard: Sidebar (w-64) + Main content (flex-1)
- Forms: max-w-2xl centered for optimal reading

---

## Component Library

### Navigation
**Public Header**: 
- Sticky top navigation with logo left, primary navigation center, "Give Now" CTA right
- Transparent on hero, solid background on scroll
- Mobile: Hamburger menu with slide-in drawer

**Organization Dashboard**:
- Persistent left sidebar (w-64) with collapsible sections
- Top bar with organization switcher, notifications, user menu
- Breadcrumb navigation for deep pages

### Donation Components

**Universal Donation Card**:
- Featured image (16:9 ratio)
- Campaign title (text-xl font-semibold)
- Progress bar with raised/goal amounts
- Organization badge/logo
- Quick give amounts (chips: $25, $50, $100, Custom)
- Primary CTA button (w-full, py-3)

**QR Code Display**:
- Centered QR code (256x256px minimum)
- Scannable border with 16px padding
- Campaign name below QR
- Short URL for manual entry
- Download/Share buttons

**Payment Flow**:
- Single-page checkout (no multi-step unless necessary)
- Stripe Elements with consistent styling
- Amount selector with large touch targets (min 44x44px)
- Cover fees checkbox (pre-checked)
- Guest checkout + Save payment option

### CRM & Admin Components

**Data Tables**:
- Sticky header row
- Alternating row backgrounds for scannability
- Row height: 56px minimum for touch targets
- Action buttons on hover (desktop) or swipe (mobile)
- Pagination with "Showing X-Y of Z" indicator

**Stat Cards**:
- Large numbers (text-3xl to text-4xl, font-bold)
- Small label above (text-sm, uppercase, tracking-wide)
- Trend indicator (↑↓ with percentage)
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-4

**Donor Profiles**:
- Header: Avatar (64x64) + Name + Total given
- Tab navigation: Activity, Details, Communications
- Timeline view for donation history with amounts and dates

### Form Elements

**Input Fields**:
- Height: h-12 for all inputs
- Padding: px-4
- Border: border-2 with rounded-lg
- Focus states: ring-4 with ring-opacity-20
- Labels: text-sm font-medium mb-2

**Buttons**:
- Primary: py-3 px-6, rounded-lg, font-semibold
- Secondary: Same size, border-2 variant
- Minimum touch target: 44x44px
- Loading states with spinner

**Toggle Switches**:
- Large size for accessibility (w-11 h-6)
- Clear on/off states
- Labels to the left

---

## Page-Specific Layouts

### Public Landing Pages

**Hero Section** (90vh):
- Full-width background image showing community/faith impact
- Centered overlay content with blur backdrop (backdrop-blur-lg)
- Headline (text-4xl to text-6xl, font-bold)
- Subheadline (text-xl, max-w-2xl)
- Dual CTAs: "Start Giving" (primary) + "For Organizations" (secondary)
- Trust indicators below: "Trusted by 500+ Organizations"

**Campaign Showcase** (py-20):
- Grid of 6-9 campaign cards (grid-cols-1 md:grid-cols-2 lg:grid-cols-3, gap-8)
- Each card: Image, title, organization, progress bar, amount raised
- "View All Campaigns" link at bottom

**How It Works** (py-24):
- Three-column layout on desktop (lg:grid-cols-3)
- Large icons (64x64) centered above each step
- Step numbers (1, 2, 3) in large, subtle typography
- Concise descriptions (max 2 sentences)

**Organizations Trust** (py-20):
- Logo grid of partnered organizations (grid-cols-3 md:grid-cols-6)
- Grayscale logos with opacity, full color on hover
- "Join 500+ Organizations" CTA below

**Testimonials** (py-24):
- Two-column layout with alternating image-text blocks
- Large quotes (text-2xl) in serif font
- Attribution with photo, name, organization

**Footer**:
- Four-column layout: About, Quick Links, Resources, Contact
- Newsletter signup (inline form)
- Social media links
- Trust badges: "Secure Donations" + payment method logos

### Organization Dashboard

**Overview Page**:
- Top: Key metrics in stat cards (grid-cols-4)
- Middle: Recent donations table + Campaign performance chart (side-by-side)
- Bottom: Quick actions panel

**Campaign Management**:
- Campaign cards in masonry/grid layout
- Inline editing capabilities
- Status badges (Active, Ended, Draft)
- Quick actions: Edit, QR Code, Share, Analytics

**Event Pages**:
- Event header with cover image (21:9 ratio)
- Details sidebar: Date, time, location, price
- Main content: Description, agenda, speakers
- Registration form in sticky sidebar
- Attendee list with avatars

### Donor Portal

**Giving History**:
- Timeline view with donation cards
- Monthly/Yearly grouping
- Download receipt buttons
- Tax summary widget at top

---

## Images

**Hero Images**: 
- Required for public landing page (1920x1080 minimum)
- Shows diverse community in faith-based settings
- Warm, hopeful imagery

**Campaign Cards**:
- 16:9 ratio thumbnails
- Real photos of impact (not stock photos)
- Consistent treatment across platform

**Organization Logos**:
- SVG or high-res PNG
- Display at 120x120 max, maintain aspect ratio

**Event Photos**:
- Cover images at 21:9 ratio
- Gallery support for multiple images

---

## PWA-Specific Considerations

**Mobile-First Interactions**:
- Bottom navigation bar for key actions on mobile
- Swipeable cards for browsing campaigns
- Pull-to-refresh on data tables
- Native-feeling transitions (transform animations, 200ms duration)

**Offline States**:
- Clear messaging when offline
- Cached donation forms for completion when online
- Sync indicator in header

**Install Prompt**:
- Subtle banner at bottom after 2 page views
- "Add to Home Screen" with icon preview
- Dismissible, doesn't re-appear for 7 days

---

## Special Features

**QR Code Generator**:
- Modal overlay with centered QR code
- Options to customize size and format
- Download as PNG/SVG
- Print-optimized version

**Live Stream Overlay**:
- Transparent donation ticker at bottom
- Recent donor names scroll across (opt-in only)
- Goal thermometer in corner (semi-transparent)
- Minimal, non-intrusive design

**AI Assistant Chat**:
- Fixed bottom-right bubble (64x64)
- Expands to chat panel (w-96, h-screen)
- Message bubbles with clear sender distinction
- Suggested quick replies

---

## Accessibility & Performance

- Minimum contrast ratio: 4.5:1 for body text
- Focus indicators: 4px ring on all interactive elements
- Skip navigation links
- ARIA labels on icon-only buttons
- Keyboard navigation throughout
- Images: Lazy loading with blur-up placeholders
- Forms: Inline validation with clear error states