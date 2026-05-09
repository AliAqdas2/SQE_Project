import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Coins, Calendar, Download, Filter } from "lucide-react";
import { format } from "date-fns";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";
import { formatCurrency as formatCurrencyByCode } from "@/lib/format-utils";
import { useState } from "react";

interface ActivityRegistration {
  id: string;
  activityId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string | null;
  parentName: string | null;
  parentEmail: string | null;
  parentPhone: string | null;
  status: string;
  stripePaymentId: string | null;
  createdAt: string;
  activity?: {
    id: string;
    title: string;
    price: string;
    currency: string;
  };
}

interface SessionResponse {
  user: { orgId: string };
}

export default function ActivityPaymentsPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/dashboard/activities/:id/payments");
  const activityId = params?.id;
  const { formatCurrency } = useOrganizationLocale();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: session } = useQuery<SessionResponse>({
    queryKey: ["/api/auth/session"],
  });

  const orgId = session?.user?.orgId;

  // Build query params
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append("startDate", startDate);
  if (endDate) queryParams.append("endDate", endDate);
  if (activityId) queryParams.append("activityId", activityId);
  const queryString = queryParams.toString();

  const { data: registrations = [], isLoading } = useQuery<ActivityRegistration[]>({
    queryKey: [`/api/org/${orgId}/activity-payments${queryString ? `?${queryString}` : ""}`],
    enabled: !!orgId,
  });

  const { data: activity } = useQuery<{ id: string; title: string }>({
    queryKey: [`/api/activities/${activityId}`],
    enabled: !!activityId,
  });

  // Filter to only paid registrations
  const paidRegistrations = registrations.filter(r => r.stripePaymentId && r.status === "confirmed");
  
  // Calculate totals
  const totalRevenue = paidRegistrations.reduce((sum, reg) => {
    const price = reg.activity?.price ? parseFloat(reg.activity.price) : 0;
    return sum + price;
  }, 0);

  const exportCSV = () => {
    if (!paidRegistrations.length) return;

    const headers = ["Date", "Student Name", "Student Email", "Activity", "Amount", "Payment ID", "Status"];
    const rows = paidRegistrations.map(r => [
      format(new Date(r.createdAt), "yyyy-MM-dd"),
      r.studentName,
      r.studentEmail,
      r.activity?.title || "N/A",
      r.activity?.price || "0",
      r.stripePaymentId || "",
      r.status,
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-payments-${activityId || "all"}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(activityId ? `/dashboard/activities/${activityId}` : "/dashboard/activities")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold">
            {activityId && activity ? `Payments - ${activity.title}` : "Activity Payments"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Filter and view payments for activities by date
          </p>
        </div>
        <Button variant="outline" onClick={exportCSV} disabled={!paidRegistrations.length} data-testid="button-export">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-start-date"
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-end-date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-payments">
              {paidRegistrations.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">
              {formatCurrency(totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm" data-testid="text-date-range">
              {startDate && endDate 
                ? `${format(new Date(startDate), "MMM d")} - ${format(new Date(endDate), "MMM d, yyyy")}`
                : startDate
                ? `From ${format(new Date(startDate), "MMM d, yyyy")}`
                : endDate
                ? `Until ${format(new Date(endDate), "MMM d, yyyy")}`
                : "All time"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {paidRegistrations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payments found for the selected date range</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paidRegistrations.map((registration) => (
                <div
                  key={registration.id}
                  className="flex items-start justify-between p-4 rounded-md border"
                  data-testid={`payment-${registration.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{registration.studentName}</p>
                      <Badge variant="outline" className="text-xs">
                        {registration.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{registration.studentEmail}</p>
                    {registration.activity && (
                      <p className="text-sm text-muted-foreground">{registration.activity.title}</p>
                    )}
                    {registration.stripePaymentId && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Payment ID: {registration.stripePaymentId.substring(0, 20)}...
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {registration.activity 
                        ? formatCurrencyByCode(parseFloat(registration.activity.price), registration.activity.currency || "USD")
                        : formatCurrency(0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(registration.createdAt), "MMM d, yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(registration.createdAt), "h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

