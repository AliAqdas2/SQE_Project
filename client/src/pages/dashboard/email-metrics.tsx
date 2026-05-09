import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, TrendingUp, MousePointerClick, AlertCircle, Users } from "lucide-react";
import { format } from "date-fns";
import type { EmailCampaign } from "@shared/schema";

interface EmailMetrics {
  totalCampaigns: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  avgOpenRate: number;
  avgClickRate: number;
  avgBounceRate: number;
  campaigns: EmailCampaign[];
}

export default function EmailMetricsPage() {
  const user = useQuery<{ user: any; org: any }>({
    queryKey: ["/api/auth/check"],
  });

  const orgId = user.data?.org?.id;

  const { data: metrics, isLoading } = useQuery<EmailMetrics>({
    queryKey: [`/api/org/${orgId}/email-metrics`],
    enabled: !!orgId,
  });

  if (isLoading) {
    return <div className="p-8">Loading metrics...</div>;
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: { variant: "secondary", label: "Draft" },
      scheduled: { variant: "outline", label: "Scheduled" },
      sending: { variant: "default", label: "Sending" },
      sent: { variant: "default", label: "Sent" },
      failed: { variant: "destructive", label: "Failed" },
    };
    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Email Metrics</h1>
        <p className="text-muted-foreground mt-1">Track your email campaign performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Mail className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-campaigns">
              {metrics?.totalCampaigns || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-sent">
              {metrics?.totalSent || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Open Rate</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-avg-open-rate">
              {metrics?.avgOpenRate ? `${Math.round(metrics.avgOpenRate * 100)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.totalOpened || 0} opened
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Click Rate</CardTitle>
            <MousePointerClick className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-avg-click-rate">
              {metrics?.avgClickRate ? `${Math.round(metrics.avgClickRate * 100)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.totalClicked || 0} clicked
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>Detailed metrics for all your campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          {!metrics || metrics.campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No campaigns to display metrics for yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {metrics.campaigns.map((campaign) => {
                const openRate = campaign.sentCount > 0
                  ? (campaign.openedCount / campaign.sentCount) * 100
                  : 0;
                const clickRate = campaign.sentCount > 0
                  ? (campaign.clickedCount / campaign.sentCount) * 100
                  : 0;
                const bounceRate = campaign.sentCount > 0
                  ? (campaign.bouncedCount / campaign.sentCount) * 100
                  : 0;

                return (
                  <Card key={campaign.id} data-testid={`campaign-${campaign.id}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{campaign.name}</h3>
                            {getStatusBadge(campaign.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                          {campaign.sentAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Sent: {format(new Date(campaign.sentAt), 'MMM dd, yyyy hh:mm a')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Sent</div>
                          <div className="text-lg font-bold">{campaign.sentCount}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Opened</div>
                          <div className="text-lg font-bold">{campaign.openedCount}</div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round(openRate)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Clicked</div>
                          <div className="text-lg font-bold">{campaign.clickedCount}</div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round(clickRate)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Bounced</div>
                          <div className="text-lg font-bold">{campaign.bouncedCount}</div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round(bounceRate)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Engagement</div>
                          <div className="text-lg font-bold">
                            {campaign.sentCount > 0
                              ? `${Math.round(((campaign.openedCount + campaign.clickedCount) / campaign.sentCount) * 100)}%`
                              : '0%'}
                          </div>
                        </div>
                      </div>

                      {bounceRate > 5 && (
                        <div className="mt-4 flex items-start gap-2 p-3 bg-destructive/10 rounded-md">
                          <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-destructive">High bounce rate detected</p>
                            <p className="text-muted-foreground">
                              Consider cleaning your email list to improve deliverability.
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
