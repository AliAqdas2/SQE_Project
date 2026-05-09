import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Coins, TrendingUp, Package, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface RevenueOverview {
  monthlyRecurringRevenue: number;
  yearlyRecurringRevenue: number;
  totalActiveSubscriptions: number;
  totalSubscriptions: number;
  revenueByPeriod: {
    monthly: number;
    yearly: number;
  };
}

interface Subscription {
  id: string;
  orgId: string;
  moduleId: string;
  stripeSubscriptionId: string;
  status: string;
  amount: number;
  currency: string;
  billingPeriod: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
  organization: {
    id: string;
    name: string;
  } | null;
  module: {
    id: string;
    title: string;
  } | null;
}

export default function RevenuePage() {
  const { data: revenueData, isLoading: revenueLoading } = useQuery<RevenueOverview>({
    queryKey: ["/api/eco-admin/revenue/overview"],
  });

  const { data: subscriptions, isLoading: subscriptionsLoading } = useQuery<Subscription[]>({
    queryKey: ["/api/eco-admin/subscriptions"],
  });

  const monthlyMRR = revenueData?.monthlyRecurringRevenue || 0;
  const yearlyARR = revenueData?.yearlyRecurringRevenue || 0;
  const activeSubscriptions = revenueData?.totalActiveSubscriptions || 0;
  const totalSubscriptions = revenueData?.totalSubscriptions || 0;

  const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    past_due: "destructive",
    canceled: "secondary",
    trialing: "outline",
  };

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-revenue">Revenue Analytics</h1>
        <p className="text-muted-foreground">
          Monitor subscription revenue and platform growth
        </p>
      </div>

      {revenueLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Monthly MRR"
              value={`$${monthlyMRR.toFixed(2)}`}
              icon={Coins}
              change={{ value: 12.5, trend: "up" }}
            />
            <StatCard
              title="Yearly ARR"
              value={`$${yearlyARR.toFixed(2)}`}
              icon={TrendingUp}
              change={{ value: 18.2, trend: "up" }}
            />
            <StatCard
              title="Active Subscriptions"
              value={activeSubscriptions.toString()}
              icon={Package}
            />
            <StatCard
              title="Total Subscriptions"
              value={totalSubscriptions.toString()}
              icon={Calendar}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>
                All active and past subscriptions across organizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : subscriptions && subscriptions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Current Period</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => (
                      <TableRow key={sub.id} data-testid={`row-subscription-${sub.id}`}>
                        <TableCell className="font-medium">
                          {sub.organization?.name || "Unknown"}
                        </TableCell>
                        <TableCell>{sub.module?.title || "Unknown"}</TableCell>
                        <TableCell>
                          <span className="font-semibold" data-testid={`text-amount-${sub.id}`}>
                            {sub.currency} ${parseFloat(sub.amount.toString()).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" data-testid={`badge-period-${sub.id}`}>
                            {sub.billingPeriod}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={statusColors[sub.status] || "secondary"}
                            data-testid={`badge-status-${sub.id}`}
                          >
                            {sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(sub.currentPeriodStart), "MMM d")} - {format(new Date(sub.currentPeriodEnd), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No subscriptions yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
