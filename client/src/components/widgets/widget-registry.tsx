import { LucideIcon, Coins, Target, Calendar, Users, Heart, Activity, TrendingUp } from "lucide-react";
import { ComponentType } from "react";

export interface WidgetMetadata {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  component: ComponentType<{ orgId: string }>;
  defaultSize?: "small" | "medium" | "large";
}

// Import widget components
import { DonationsWidget } from "./donations-widget.tsx";
import { CampaignsWidget } from "./campaigns-widget.tsx";
import { EventsWidget } from "./events-widget.tsx";
import { VolunteersWidget } from "./volunteers-widget.tsx";
import { RecentActivityWidget } from "./recent-activity-widget.tsx";
import { BeneficiariesWidget } from "./beneficiaries-widget.tsx";
import { ActivitiesWidget } from "./activities-widget.tsx";

export const WIDGET_REGISTRY: Record<string, WidgetMetadata> = {
  donations: {
    id: "donations",
    title: "Donations Overview",
    description: "Track donation trends and totals",
    icon: Coins,
    component: DonationsWidget,
    defaultSize: "large",
  },
  campaigns: {
    id: "campaigns",
    title: "Active Campaigns",
    description: "Monitor campaign performance",
    icon: Target,
    component: CampaignsWidget,
    defaultSize: "medium",
  },
  events: {
    id: "events",
    title: "Upcoming Events",
    description: "Track event registrations",
    icon: Calendar,
    component: EventsWidget,
    defaultSize: "medium",
  },
  volunteers: {
    id: "volunteers",
    title: "Volunteer Stats",
    description: "Volunteer hours and participation",
    icon: Users,
    component: VolunteersWidget,
    defaultSize: "small",
  },
  beneficiaries: {
    id: "beneficiaries",
    title: "Beneficiaries",
    description: "Support distribution overview",
    icon: Heart,
    component: BeneficiariesWidget,
    defaultSize: "small",
  },
  activities: {
    id: "activities",
    title: "Activities & Classes",
    description: "Class enrollment and participation",
    icon: TrendingUp,
    component: ActivitiesWidget,
    defaultSize: "small",
  },
  "recent-activity": {
    id: "recent-activity",
    title: "Recent Activity",
    description: "Latest actions and updates",
    icon: Activity,
    component: RecentActivityWidget,
    defaultSize: "medium",
  },
};
