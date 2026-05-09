import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard } from "@/contexts/dashboard-context";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";

interface ActivityAnalytics {
  activeActivities: number;
  totalEnrollments: number;
  averageAttendance: number;
  revenue: number;
}

export function ActivitiesWidget({ orgId }: { orgId: string }) {
  const { dateRange } = useDashboard();
  const { formatCurrency } = useOrganizationLocale();

  const { data, isLoading } = useQuery<ActivityAnalytics>({
    queryKey: ["/api/org", orgId, "analytics/activities", dateRange.from, dateRange.to],
    enabled: !!orgId,
  });

  if (isLoading) {
    return (
      <Card data-testid="widget-activities">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Activities & Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[100px]" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card data-testid="widget-activities">
        <CardHeader>
          <CardTitle>Activities & Classes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No activity data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="widget-activities" className="hover-elevate">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Activities & Classes
        </CardTitle>
        <CardDescription>
          {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold" data-testid="text-active-activities">{data.activeActivities}</p>
            <p className="text-xs text-muted-foreground">Active Classes</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{data.totalEnrollments}</p>
            <p className="text-xs text-muted-foreground">Enrollments</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
          <div>
            <p className="text-sm text-muted-foreground">Avg Attendance</p>
            <p className="text-lg font-semibold">{data.averageAttendance.toFixed(0)}%</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Revenue</p>
            <p className="text-lg font-semibold">{formatCurrency(data.revenue)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
