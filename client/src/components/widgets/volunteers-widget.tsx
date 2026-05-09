import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard } from "@/contexts/dashboard-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Clock } from "lucide-react";
import { format } from "date-fns";

interface VolunteerAnalytics {
  activeVolunteers: number;
  totalHours: number;
  averageHoursPerVolunteer: number;
  newVolunteers: number;
}

export function VolunteersWidget({ orgId }: { orgId: string }) {
  const { dateRange } = useDashboard();

  const { data, isLoading } = useQuery<VolunteerAnalytics>({
    queryKey: ["/api/org", orgId, "analytics/volunteers", dateRange.from, dateRange.to],
    enabled: !!orgId,
  });

  if (isLoading) {
    return (
      <Card data-testid="widget-volunteers">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Volunteer Stats
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
      <Card data-testid="widget-volunteers">
        <CardHeader>
          <CardTitle>Volunteer Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No volunteer data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="widget-volunteers" className="hover-elevate">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Volunteer Stats
        </CardTitle>
        <CardDescription>
          {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold" data-testid="text-active-volunteers">{data.activeVolunteers}</p>
            <p className="text-xs text-muted-foreground">Active Volunteers</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">+{data.newVolunteers}</p>
            <p className="text-xs text-muted-foreground">New This Period</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-lg font-semibold">{data.totalHours} hrs</p>
            <p className="text-xs text-muted-foreground">
              Avg {data.averageHoursPerVolunteer.toFixed(1)} hrs/volunteer
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
