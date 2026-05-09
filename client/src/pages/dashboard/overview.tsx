import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings2, RefreshCw, LayoutDashboard, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";
import type { DashboardPreferences } from "@shared/schema";
import { PANEL_REGISTRY } from "@/components/dashboard-panels/panel-registry";
import { CustomizationPanel } from "@/components/dashboard-panels/customization-panel";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EnabledModule {
  id: string;
  orgId: string;
  moduleId: string;
  enabledAt: string;
  status: string;
  module: {
    id: string;
    moduleKey: string;
    title: string;
    description: string;
    isDefault: boolean;
  };
}

export default function OverviewPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [localEnabledPanels, setLocalEnabledPanels] = useState<string[] | null>(null);
  
  // Get current user to retrieve orgId and userId
  const { data: session } = useQuery<{ user: { orgId: string; id: string } }>({
    queryKey: ["/api/auth/session"],
  });

  const orgId = session?.user?.orgId;
  const userId = session?.user?.id;

  // Fetch dashboard preferences
  const { data: preferences, isLoading: loadingPrefs } = useQuery<DashboardPreferences>({
    queryKey: ["/api/dashboard/preferences", orgId],
    enabled: !!orgId && !!userId,
  });

  // Sync local state with server preferences when they load or change
  useEffect(() => {
    if (preferences?.widgetLayout?.enabled) {
      setLocalEnabledPanels(preferences.widgetLayout.enabled);
    } else if (preferences && !preferences.widgetLayout?.enabled) {
      setLocalEnabledPanels(null);
    }
  }, [preferences?.widgetLayout?.enabled]);

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
      await queryClient.cancelQueries({ queryKey: ["/api/dashboard/preferences", orgId] });
      const previousPrefs = queryClient.getQueryData<DashboardPreferences>(["/api/dashboard/preferences", orgId]);
      if (previousPrefs) {
        queryClient.setQueryData<DashboardPreferences>(["/api/dashboard/preferences", orgId], {
          ...previousPrefs,
          ...updates,
          updatedAt: new Date(),
        });
      }
      return { previousPrefs };
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["/api/dashboard/preferences", orgId] });
      toast({
        title: "Preferences saved",
        description: "Your dashboard has been updated",
      });
    },
    onError: (error, variables, context) => {
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

  // Use local state if available, otherwise fall back to server preferences or defaults
  const defaultPanels = ["kpi-cards", "active-modules", "recent-donations", "campaign-performance"];
  const enabledPanels = localEnabledPanels || preferences?.widgetLayout?.enabled || defaultPanels;
  const panelOrder = preferences?.widgetLayout?.order || enabledPanels;

  const togglePanel = (panelId: string) => {
    const newEnabled = enabledPanels.includes(panelId)
      ? enabledPanels.filter((id) => id !== panelId)
      : [...enabledPanels, panelId];

    // Update local state immediately for instant UI feedback
    setLocalEnabledPanels(newEnabled);

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

  const { data: enabledModules } = useQuery<EnabledModule[]>({
    queryKey: [`/api/org/${orgId}/modules`],
    enabled: !!orgId,
  });

  if (loadingPrefs) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Filter and sort panels based on preferences
  const panelsToRender = panelOrder
    .filter((panelId) => enabledPanels.includes(panelId))
    .map((panelId) => PANEL_REGISTRY[panelId])
    .filter((panel): panel is typeof panel & { id: string } => {
      if (!panel) return false;
      // Check if panel requires a module
      if (panel.requiresModule) {
        return enabledModules?.some((em) => em.module.moduleKey === panel.requiresModule) || false;
      }
      return true;
    });

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Your fundraising command center
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isCustomizing ? "default" : "outline"}
            size="sm"
            onClick={() => setIsCustomizing(!isCustomizing)}
            data-testid="button-customize"
          >
            <Settings2 className="w-4 h-4 mr-2" />
            Customize
          </Button>
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
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="gap-2"
              onClick={() => setLocation("/dashboard/analytics")}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Render Panels */}
      <div className="space-y-6">
        {panelsToRender.map((panel, index) => {
          const PanelComponent = panel.component;
          
          // Check if this is the first panel that should be in a grid
          const gridPanels = ["recent-donations", "campaign-performance", "prayer-times"];
          const isGridPanel = gridPanels.includes(panel.id);
          const previousPanels = panelsToRender.slice(0, index);
          const isFirstGridPanel = isGridPanel && !previousPanels.some(p => gridPanels.includes(p.id));
          
          if (isFirstGridPanel) {
            // Render all grid panels together in a grid
            const gridPanelsToRender = panelsToRender.filter(p => gridPanels.includes(p.id));
            return (
              <div key="grid-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {gridPanelsToRender.map((gridPanel) => {
                  const GridPanelComponent = gridPanel.component;
                  return (
                    <div key={gridPanel.id} data-testid={`panel-${gridPanel.id}`}>
                      <GridPanelComponent orgId={orgId || ""} enabledModules={enabledModules} />
                    </div>
                  );
                })}
              </div>
            );
          }
          
          // Skip if this panel is already rendered in the grid
          if (isGridPanel) {
            return null;
          }
          
          return (
            <div key={panel.id} data-testid={`panel-${panel.id}`}>
              <PanelComponent orgId={orgId || ""} enabledModules={enabledModules} />
            </div>
          );
        })}
      </div>

      {panelsToRender.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No panels enabled</p>
          <p className="text-sm text-muted-foreground mt-2">
            Click the Customize button to enable dashboard panels
          </p>
        </Card>
      )}

      {/* Customization Panel */}
      <CustomizationPanel
        open={isCustomizing}
        onOpenChange={setIsCustomizing}
        enabledPanels={enabledPanels}
        onTogglePanel={togglePanel}
        enabledModules={enabledModules}
      />
    </div>
  );
}
