import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, ArrowLeft, Eye, Crown, ArrowRight } from "lucide-react";
import type { Campaign, Organization } from "@shared/schema";
import { CampaignPageBuilder, type PageComponent } from "@/components/campaign-page-builder";

interface SessionResponse {
  user: {
    orgId: string;
  };
}

interface SubscriptionInfo {
  subscription: { id: string; planId: string; status: string };
  plan: { id: string; tierCode: string; name: string };
}

export default function CampaignBuilderPage() {
  const params = useParams();
  const campaignId = params.id;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [pageComponents, setPageComponents] = useState<PageComponent[]>([]);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const hasLoadedRef = useRef(false);

  const { data: sessionData } = useQuery<SessionResponse>({
    queryKey: ["/api/auth/session"],
  });

  const orgId = sessionData?.user?.orgId;

  // Check subscription status
  const { data: subscriptionInfo, isLoading: subscriptionLoading } = useQuery<SubscriptionInfo>({
    queryKey: ["/api/org", orgId, "subscription"],
    enabled: !!orgId,
  });

  const isFreePlan = subscriptionInfo?.plan?.tierCode?.toLowerCase() === "free";

  const { data: organization } = useQuery<Organization>({
    queryKey: [`/api/org/${orgId}`],
    enabled: !!orgId,
  });

  const { data: campaign, isLoading } = useQuery<Campaign>({
    queryKey: ["/api/campaigns", campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}`);
      if (!res.ok) throw new Error("Failed to fetch campaign");
      return res.json();
    },
    enabled: !!campaignId,
  });

  // Show upgrade prompt for free plan users
  if (!subscriptionLoading && isFreePlan) {
    return (
      <div className="p-4 md:p-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Upgrade to Use Page Builder</h2>
              <p className="text-muted-foreground max-w-md">
                The campaign page builder is a premium feature. Upgrade your plan to 
                customize your campaign pages with our drag-and-drop builder.
              </p>
            </div>
            <Button size="lg" onClick={() => navigate("/dashboard/subscription")} data-testid="button-upgrade-builder">
              View Plans & Upgrade
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Load existing page components when campaign data is available (only once to preserve edits)
  useEffect(() => {
    if (campaign && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      if (campaign.pageComponents) {
        setPageComponents(campaign.pageComponents as PageComponent[]);
      }
    }
  }, [campaign]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/campaigns/${campaignId}`, {
        pageComponents: pageComponents,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"], exact: false });
      toast({
        title: "Page Updated",
        description: "Your campaign page has been updated successfully.",
      });
      navigate("/dashboard/campaigns");
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update campaign page. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Campaign not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const previewUrl = organization?.slug && campaignId
    ? `/c/${organization.slug}/${campaignId}`
    : null;

  const handlePreview = async () => {
    if (!previewUrl) return;

    setIsPreviewing(true);
    try {
      // Auto-save before preview to ensure latest changes are visible
      await apiRequest("PATCH", `/api/campaigns/${campaignId}`, {
        pageComponents: pageComponents,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"], exact: false });
      
      // Open preview in new tab
      window.open(previewUrl, "_blank");
      
      toast({
        title: "Preview opened",
        description: "Your changes have been saved and the preview is ready.",
      });
    } catch (error: any) {
      toast({
        title: "Preview failed",
        description: error.message || "Failed to save changes before preview.",
        variant: "destructive",
      });
    } finally {
      setIsPreviewing(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/dashboard/campaigns")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{campaign.title}</h1>
            <p className="text-muted-foreground">Customize your campaign page</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={!previewUrl || isPreviewing}
            data-testid="button-preview"
          >
            {isPreviewing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </>
            )}
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            data-testid="button-save"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Page
              </>
            )}
          </Button>
        </div>
      </div>

      <CampaignPageBuilder
        components={pageComponents}
        onChange={setPageComponents}
      />
    </div>
  );
}
