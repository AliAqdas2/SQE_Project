import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardProvider, useDashboard, DateRangePreset } from "@/contexts/dashboard-context";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings2, RefreshCw, LayoutDashboard, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";
import { WIDGET_REGISTRY, WidgetMetadata } from "@/components/widgets/widget-registry.tsx";
import { AnalyticsCustomizationPanel } from "@/components/dashboard-panels/analytics-customization-panel";
import { DashboardPreferences } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface DashboardContentProps {
  orgId: string;
  userId: string;
}

function DashboardContent({ orgId, userId }: DashboardContentProps) {
  const { preset, setPreset, dateRange } = useDashboard();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isCustomizing, setIsCustomizing] = useState(false);
  
  // Local state for immediate UI updates
  const [localEnabledWidgets, setLocalEnabledWidgets] = useState<string[] | null>(null);

  // Fetch dashboard preferences
  const { data: preferences, isLoading: loadingPrefs } = useQuery<DashboardPreferences>({
    queryKey: ["/api/dashboard/preferences", orgId],
    enabled: !!orgId && !!userId,
  });
  
  // Sync local state with server preferences when they load or change
  useEffect(() => {
    if (preferences?.widgetLayout?.enabled) {
      setLocalEnabledWidgets(preferences.widgetLayout.enabled);
    } else if (preferences && !preferences.widgetLayout?.enabled) {
      // If preferences loaded but no enabled widgets, reset to null to use defaults
      setLocalEnabledWidgets(null);
    }
  }, [preferences?.widgetLayout?.enabled]); // Only watch the enabled array

  // Update preferences mutation
  const updatePrefs = useMutation({
    mutationFn: async (updates: Partial<DashboardPreferences>) => {
      const response = await apiRequest("PATCH", "/api/dashboard/preferences", { ...updates, orgId });
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      throw new Error('Failed to update preferences');
    },
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/dashboard/preferences", orgId] });
      
      // Snapshot previous value
      const previousPrefs = queryClient.getQueryData<DashboardPreferences>(["/api/dashboard/preferences", orgId]);
      
      // Optimistically update
      if (previousPrefs) {
        queryClient.setQueryData<DashboardPreferences>(["/api/dashboard/preferences", orgId], {
          ...previousPrefs,
          ...updates,
          updatedAt: new Date(),
        });
      }
      
      return { previousPrefs };
    },
    onSuccess: async (data) => {
      console.log('[Dashboard] onSuccess - refetching');
      await queryClient.refetchQueries({ queryKey: ["/api/dashboard/preferences", orgId] });
      toast({
        title: "Preferences saved",
        description: "Your dashboard has been updated",
      });
    },
    onError: (error, variables, context) => {
      console.error('[Dashboard] onError - rolling back', error);
      // Rollback on error
      if (context?.previousPrefs) {
        queryClient.setQueryData(["/api/dashboard/preferences", orgId], context.previousPrefs);
      }
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      });
    },
  });

  // Use local state if available, otherwise fall back to server preferences
  const enabledWidgets = localEnabledWidgets || preferences?.widgetLayout?.enabled || [
    "donations",
    "campaigns",
    "events",
    "volunteers",
    "beneficiaries",
    "activities",
    "recent-activity",
  ];

  const toggleWidget = (widgetId: string) => {
    const newEnabled = enabledWidgets.includes(widgetId)
      ? enabledWidgets.filter((id) => id !== widgetId)
      : [...enabledWidgets, widgetId];

    // Update local state IMMEDIATELY for instant UI feedback
    setLocalEnabledWidgets(newEnabled);

    const newLayout = {
      enabled: newEnabled,
      order: newEnabled,
      sizes: {},
    };

    // Then save to server in background
    updatePrefs.mutate({
      widgetLayout: newLayout,
    });
  };

  if (loadingPrefs) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="heading-analytics">
            Analytics Dashboard
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Track your organization's performance
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Date Range Selector */}
          <Select value={preset} onValueChange={(value) => setPreset(value as DateRangePreset)}>
            <SelectTrigger className="flex-1 sm:w-[180px]" data-testid="select-date-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7days">Last 7 days</SelectItem>
              <SelectItem value="last30days">Last 30 days</SelectItem>
              <SelectItem value="last90days">Last 90 days</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
            </SelectContent>
          </Select>

          {/* Customize Button */}
          <Button
            variant={isCustomizing ? "default" : "outline"}
              size="sm"
            onClick={() => setIsCustomizing(!isCustomizing)}
            data-testid="button-customize-dashboard"
          >
              <Settings2 className="w-4 h-4 mr-2" />
              Customize
          </Button>

          {/* Refresh Button */}
          <Button
            variant="outline"
              size="sm"
            onClick={() => queryClient.invalidateQueries()}
            data-testid="button-refresh"
          >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
          </Button>
        </div>
      </div>

        {/* Dashboard Type Tabs */}
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList>
            <TabsTrigger 
              value="overview" 
                className="gap-2"
              onClick={() => setLocation("/dashboard")}
              >
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>
        </Tabs>
          </div>

      {/* Customization Panel (Sheet) */}
      <AnalyticsCustomizationPanel
        open={isCustomizing}
        onOpenChange={setIsCustomizing}
        enabledWidgets={enabledWidgets}
        onToggleWidget={toggleWidget}
      />

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enabledWidgets.map((widgetId) => {
          const widget = WIDGET_REGISTRY[widgetId];
          if (!widget) return null;

          const WidgetComponent = widget.component;

          return (
            <div
              key={widgetId}
              className={
                widget.defaultSize === "large"
                  ? "md:col-span-2 lg:col-span-3"
                  : widget.defaultSize === "medium"
                  ? "md:col-span-2 lg:col-span-2"
                  : "md:col-span-1 lg:col-span-1"
              }
              data-testid={`widget-container-${widgetId}`}
            >
              <WidgetComponent orgId={orgId} />
            </div>
          );
        })}
      </div>

      {enabledWidgets.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No widgets enabled</p>
          <p className="text-sm text-muted-foreground mt-2">
            Click the settings icon to customize your dashboard
          </p>
        </Card>
      )}
    </div>
  );
}

export default function AnalyticsDashboard() {
  // Get current user session to retrieve orgId and userId
  const { data: session } = useQuery<{ user: { id: string; orgId: string } }>({
    queryKey: ["/api/auth/session"],
  });

  const orgId = session?.user?.orgId || "";
  const userId = session?.user?.id || "";

  if (!orgId || !userId) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <DashboardProvider>
      <DashboardContent orgId={orgId} userId={userId} />
    </DashboardProvider>
  );
}
