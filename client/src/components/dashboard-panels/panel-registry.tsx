import { LucideIcon, Coins, Package, TrendingUp, Heart, Calendar } from "lucide-react";
import { ComponentType } from "react";
import { KPICardsPanel } from "./kpi-cards-panel";
import { ActiveModulesPanel } from "./active-modules-panel";
import { RecentDonationsPanel } from "./recent-donations-panel";
import { CampaignPerformancePanel } from "./campaign-performance-panel";
import { PrayerTimesPanel } from "./prayer-times-panel";

export interface PanelMetadata {
  id: string;
  title: string;
  icon: LucideIcon;
  component: ComponentType<{ orgId: string; enabledModules?: Array<{ module: { moduleKey: string } }> }>;
  requiresModule?: string; // Module key required for this panel
}

export const PANEL_REGISTRY: Record<string, PanelMetadata> = {
  "kpi-cards": {
    id: "kpi-cards",
    title: "KPI Cards",
    icon: Coins,
    component: KPICardsPanel,
  },
  "active-modules": {
    id: "active-modules",
    title: "Active Modules",
    icon: Package,
    component: ActiveModulesPanel,
  },
  "recent-donations": {
    id: "recent-donations",
    title: "Recent Donations",
    icon: TrendingUp,
    component: RecentDonationsPanel,
  },
  "campaign-performance": {
    id: "campaign-performance",
    title: "Campaign Performance",
    icon: Heart,
    component: CampaignPerformancePanel,
  },
  "prayer-times": {
    id: "prayer-times",
    title: "Prayer Times",
    icon: Calendar,
    component: PrayerTimesPanel,
    requiresModule: "prayer_timetable",
  },
};
