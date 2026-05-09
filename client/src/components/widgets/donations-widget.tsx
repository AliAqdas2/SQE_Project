import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard } from "@/contexts/dashboard-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins, TrendingUp, TrendingDown, Users } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";

interface DonationsAnalytics {
  totalAmount: number;
  donationCount: number;
  averageDonation: number;
  uniqueDonors: number;
  percentChange: number;
  timeline: Array<{
    date: string;
    amount: number;
    count: number;
  }>;
}

export function DonationsWidget({ orgId }: { orgId: string }) {
  const { dateRange } = useDashboard();
  const { formatCurrency, currencySymbol } = useOrganizationLocale();

  const { data, isLoading } = useQuery<DonationsAnalytics>({
    queryKey: ["/api/org", orgId, "analytics/donations", dateRange.from, dateRange.to],
    enabled: !!orgId,
  });

  if (isLoading) {
    return (
      <Card data-testid="widget-donations">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Donations Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px]" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card data-testid="widget-donations">
        <CardHeader>
          <CardTitle>Donations Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No donation data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="widget-donations" className="hover-elevate">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5" />
          Donations Overview
        </CardTitle>
        <CardDescription>
          {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Raised</p>
            <p className="text-2xl font-bold" data-testid="text-total-donations">
              {formatCurrency(data.totalAmount)}
            </p>
            <div className="flex items-center gap-1 text-xs">
              {data.percentChange >= 0 ? (
                <>
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-green-600">+{data.percentChange.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3 h-3 text-red-600" />
                  <span className="text-red-600">{data.percentChange.toFixed(1)}%</span>
                </>
              )}
              <span className="text-muted-foreground">vs previous period</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Donations</p>
            <p className="text-2xl font-bold" data-testid="text-donation-count">{data.donationCount}</p>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(data.averageDonation)}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Unique Donors</p>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <p className="text-lg font-semibold">{data.uniqueDonors}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.timeline}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(new Date(value), "MMM d")}
                className="text-xs"
              />
              <YAxis 
                tickFormatter={(value) => `${currencySymbol}${value}`}
                className="text-xs"
              />
              <Tooltip 
                labelFormatter={(value) => format(new Date(value), "MMM d, yyyy")}
                formatter={(value: number) => [formatCurrency(value), "Amount"]}
              />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
