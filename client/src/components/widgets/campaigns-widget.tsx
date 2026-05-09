import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDashboard } from "@/contexts/dashboard-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Target } from "lucide-react";
import { format } from "date-fns";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";

interface CampaignAnalytics {
  activeCampaigns: number;
  totalGoal: number;
  totalRaised: number;
  completionRate: number;
  topCampaigns: Array<{
    id: string;
    title: string;
    goalAmount: number;
    currentAmount: number;
    percentage: number;
  }>;
}

export function CampaignsWidget({ orgId }: { orgId: string }) {
  const { dateRange } = useDashboard();
  const { formatCurrency } = useOrganizationLocale();

  const { data, isLoading } = useQuery<CampaignAnalytics>({
    queryKey: ["/api/org", orgId, "analytics/campaigns", dateRange.from, dateRange.to],
    enabled: !!orgId,
  });

  if (isLoading) {
    return (
      <Card data-testid="widget-campaigns">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Active Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[150px]" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card data-testid="widget-campaigns">
        <CardHeader>
          <CardTitle>Active Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No campaign data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="widget-campaigns" className="hover-elevate">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Active Campaigns
        </CardTitle>
        <CardDescription>
          {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold" data-testid="text-active-campaigns">{data.activeCampaigns}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{formatCurrency(data.totalRaised)}</p>
            <p className="text-xs text-muted-foreground">Raised</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{data.completionRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Average</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">Top Performing Campaigns</p>
          {data.topCampaigns.length === 0 ? (
            <p className="text-xs text-muted-foreground">No campaigns yet</p>
          ) : (
            data.topCampaigns.slice(0, 3).map((campaign) => (
              <div key={campaign.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate">{campaign.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(campaign.currentAmount)} / {formatCurrency(campaign.goalAmount)}
                  </span>
                </div>
                <Progress value={campaign.percentage} className="h-2" />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
