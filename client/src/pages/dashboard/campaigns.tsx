import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, QrCode, Crown, ArrowRight } from "lucide-react";
import { CampaignCard } from "@/components/campaign-card";
import { QRCodeDisplay } from "@/components/qr-code-display";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Campaign, Organization } from "@shared/schema";
import { useLocation } from "wouter";

interface CampaignWithDonorCount extends Campaign {
  donorCount?: number;
}

interface User {
  id: string;
  orgId: string;
  email: string;
}

interface SessionResponse {
  user: User;
}

interface SubscriptionInfo {
  subscription: {
    id: string;
    planId: string;
    status: string;
  };
  plan: {
    id: string;
    tierCode: string;
    name: string;
  };
}

export default function CampaignsPage() {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [, navigate] = useLocation();

  // Get current user session
  const { data: session } = useQuery<SessionResponse>({
    queryKey: ["/api/auth/session"],
  });
  
  const user = session?.user;

  // Get organization details
  const { data: org } = useQuery<Organization>({
    queryKey: ["/api/org"],
    enabled: !!user,
  });

  // Check subscription status
  const { data: subscriptionInfo, isLoading: subscriptionLoading } = useQuery<SubscriptionInfo>({
    queryKey: ["/api/org", user?.orgId, "subscription"],
    enabled: !!user?.orgId,
  });

  const isFreePlan = subscriptionInfo?.plan?.tierCode?.toLowerCase() === "free";

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
              <h2 className="text-2xl font-bold">Upgrade to Access Campaigns</h2>
              <p className="text-muted-foreground max-w-md">
                Campaign management is a premium feature. Upgrade your plan to create 
                and manage fundraising campaigns with AI-powered tools, real-time analytics, 
                and peer-to-peer fundraising.
              </p>
            </div>
            <Button size="lg" onClick={() => navigate("/dashboard/subscription")} data-testid="button-upgrade-campaigns">
              View Plans & Upgrade
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: campaigns, isLoading, error } = useQuery<CampaignWithDonorCount[]>({
    queryKey: ["/api/campaigns", user?.orgId],
    queryFn: async () => {
      console.log("Fetching campaigns for orgId:", user?.orgId);
      const res = await fetch(`/api/campaigns?orgId=${user?.orgId}`);
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to fetch campaigns:", res.status, errorText);
        throw new Error("Failed to fetch campaigns");
      }
      const data = await res.json();
      console.log("Campaigns fetched:", data);
      return data;
    },
    enabled: !!user?.orgId,
  });

  const handleQRCodeClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setQrDialogOpen(true);
  };

  if (isLoading || !user) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive mb-4">Failed to load campaigns: {error.message}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Campaigns</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage your fundraising campaigns
          </p>
        </div>
        <Button onClick={() => navigate("/dashboard/campaigns/create")} className="w-full sm:w-auto" data-testid="button-create-campaign">
          <Plus className="mr-2 h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      {campaigns && campaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              {...campaign}
              organization={org?.name || ""}
              raised={parseFloat(campaign.currentAmount)}
              goal={parseFloat(campaign.goalAmount)}
              donorCount={campaign.donorCount || 0}
              onQRCodeClick={() => handleQRCodeClick(campaign)}
              onDonateClick={() => org?.slug && navigate(`/c/${org.slug}/${campaign.id}`)}
              onManageClick={() => navigate(`/dashboard/campaigns/${campaign.id}/manage`)}
              onEditClick={() => navigate(`/dashboard/campaigns/${campaign.id}/edit`)}
              onPageBuilderClick={() => navigate(`/dashboard/campaigns/${campaign.id}/builder`)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No campaigns yet</p>
            <Button onClick={() => navigate("/dashboard/campaigns/create")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Campaign
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Campaign QR Code</DialogTitle>
          </DialogHeader>
          {selectedCampaign && org?.slug ? (
            <QRCodeDisplay
              campaignName={selectedCampaign.title}
              url={`${window.location.origin}/c/${org.slug}/${selectedCampaign.id}`}
            />
          ) : (
            <div className="flex items-center justify-center p-8">
              <p className="text-muted-foreground">Loading QR code...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
