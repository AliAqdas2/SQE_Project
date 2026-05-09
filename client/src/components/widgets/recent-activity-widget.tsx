import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard } from "@/contexts/dashboard-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Coins, UserPlus, Calendar, Target } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface RecentActivity {
  id: string;
  type: "donation" | "volunteer" | "event" | "campaign";
  description: string;
  timestamp: string;
  metadata?: any;
}

interface RecentActivityData {
  activities: RecentActivity[];
}

export function RecentActivityWidget({ orgId }: { orgId: string }) {
  const { dateRange } = useDashboard();

  const { data, isLoading } = useQuery<RecentActivityData>({
    queryKey: ["/api/org", orgId, "analytics/recent-activity", dateRange.from, dateRange.to],
    enabled: !!orgId,
  });

  if (isLoading) {
    return (
      <Card data-testid="widget-recent-activity">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px]" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.activities.length === 0) {
    return (
      <Card data-testid="widget-recent-activity">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No recent activity</p>
        </CardContent>
      </Card>
    );
  }

  const getIcon = (type: RecentActivity["type"]) => {
    switch (type) {
      case "donation":
        return <Coins className="w-4 h-4" />;
      case "volunteer":
        return <UserPlus className="w-4 h-4" />;
      case "event":
        return <Calendar className="w-4 h-4" />;
      case "campaign":
        return <Target className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <Card data-testid="widget-recent-activity" className="hover-elevate">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.activities.slice(0, 5).map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-2 rounded-md bg-muted/50">
              <div className="mt-0.5 text-muted-foreground">
                {getIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{activity.description}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
