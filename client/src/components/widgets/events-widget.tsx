import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard } from "@/contexts/dashboard-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Users, TicketIcon } from "lucide-react";
import { format } from "date-fns";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";

interface EventAnalytics {
  upcomingEvents: number;
  totalRegistrations: number;
  totalRevenue: number;
  events: Array<{
    id: string;
    title: string;
    startDate: string;
    registrationCount: number;
  }>;
}

export function EventsWidget({ orgId }: { orgId: string }) {
  const { dateRange } = useDashboard();
  const { formatCurrency } = useOrganizationLocale();

  const { data, isLoading } = useQuery<EventAnalytics>({
    queryKey: ["/api/org", orgId, "analytics/events", dateRange.from, dateRange.to],
    enabled: !!orgId,
  });

  if (isLoading) {
    return (
      <Card data-testid="widget-events">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Events
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
      <Card data-testid="widget-events">
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No event data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="widget-events" className="hover-elevate">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Upcoming Events
        </CardTitle>
        <CardDescription>
          {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold" data-testid="text-upcoming-events">{data.upcomingEvents}</p>
            <p className="text-xs text-muted-foreground">Events</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{data.totalRegistrations}</p>
            <p className="text-xs text-muted-foreground">Registrations</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</p>
            <p className="text-xs text-muted-foreground">Revenue</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Upcoming</p>
          {data.events.length === 0 ? (
            <p className="text-xs text-muted-foreground">No upcoming events</p>
          ) : (
            data.events.slice(0, 3).map((event) => (
              <div key={event.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                <div className="flex-1 truncate">
                  <p className="font-medium truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(event.date), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>{event.registrationCount}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
