import { PrayerTimesWidget } from "@/components/prayer-times-widget";

interface PrayerTimesPanelProps {
  orgId: string;
  enabledModules?: Array<{ module: { moduleKey: string } }>;
}

export function PrayerTimesPanel({ orgId, enabledModules }: PrayerTimesPanelProps) {
  // Only show if prayer_timetable module is enabled
  if (!enabledModules?.some(m => m.module.moduleKey === 'prayer_timetable')) {
    return null;
  }

  return <PrayerTimesWidget />;
}
