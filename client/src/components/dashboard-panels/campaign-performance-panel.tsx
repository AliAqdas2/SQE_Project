import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import { Link } from "wouter";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";
import type { Campaign, Donation } from "@shared/schema";

interface CampaignPerformancePanelProps {
  orgId: string;
  enabledModules?: Array<{ module: { moduleKey: string } }>;
}

export function CampaignPerformancePanel({ orgId }: CampaignPerformancePanelProps) {
  const { formatCurrency } = useOrganizationLocale();

  const { data: campaigns } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns", orgId],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns?orgId=${orgId}`);
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      return res.json();
    },
    enabled: !!orgId,
  });

  const { data: donations } = useQuery<Donation[]>({
    queryKey: ["/api/donations", orgId],
    queryFn: async () => {
      const res = await fetch(`/api/donations?orgId=${orgId}`);
      if (!res.ok) throw new Error("Failed to fetch donations");
      return res.json();
    },
    enabled: !!orgId,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {campaigns && campaigns.length > 0 ? (
          <div className="space-y-3">
            {campaigns.map((campaign) => {
              const currentAmount = parseFloat(campaign.currentAmount);
              const goalAmount = parseFloat(campaign.goalAmount);
              const progress = (currentAmount / goalAmount) * 100;
              const campaignDonations = donations?.filter(d => d.campaignId === campaign.id) || [];
              const donationCount = campaignDonations.length;
              
              return (
                <Link key={campaign.id} href={`/dashboard/campaigns/${campaign.id}/manage`}>
                  <div className="p-4 border rounded-lg hover-elevate active-elevate-2 cursor-pointer space-y-3" data-testid={`campaign-card-${campaign.id}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate" data-testid={`text-campaign-name-${campaign.id}`}>
                          {campaign.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {donationCount} {donationCount === 1 ? "donation" : "donations"}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {progress.toFixed(0)}%
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Raised</span>
                        <span className="font-semibold">{formatCurrency(currentAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Goal</span>
                        <span className="font-medium">{formatCurrency(goalAmount)}</span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className="bg-primary rounded-full h-2.5 transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No campaigns yet
            </p>
            <Link href="/dashboard/campaigns/create">
              <Button variant="outline" size="sm">
                <Heart className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
