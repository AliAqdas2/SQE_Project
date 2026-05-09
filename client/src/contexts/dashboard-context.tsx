import { createContext, useContext, useState, ReactNode } from "react";
import { subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";

export interface DateRange {
  from: Date;
  to: Date;
}

export type DateRangePreset = "last7days" | "last30days" | "last90days" | "thisMonth" | "lastMonth" | "custom";

interface DashboardContextType {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  preset: DateRangePreset;
  setPreset: (preset: DateRangePreset) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [preset, setPreset] = useState<DateRangePreset>("last30days");
  const [dateRange, setDateRange] = useState<DateRange>(() => getDateRangeForPreset("last30days"));

  const handlePresetChange = (newPreset: DateRangePreset) => {
    setPreset(newPreset);
    if (newPreset !== "custom") {
      setDateRange(getDateRangeForPreset(newPreset));
    }
  };

  return (
    <DashboardContext.Provider 
      value={{ 
        dateRange, 
        setDateRange, 
        preset, 
        setPreset: handlePresetChange 
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
}

function getDateRangeForPreset(preset: DateRangePreset): DateRange {
  const now = new Date();
  switch (preset) {
    case "last7days":
      return { from: subDays(now, 7), to: now };
    case "last30days":
      return { from: subDays(now, 30), to: now };
    case "last90days":
      return { from: subDays(now, 90), to: now };
    case "thisMonth":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "lastMonth": {
      const lastMonth = subMonths(now, 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    }
    default:
      return { from: subDays(now, 30), to: now };
  }
}
