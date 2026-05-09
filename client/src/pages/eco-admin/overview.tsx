import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Coins, 
  Users, 
  Building2, 
  TrendingUp, 
  Package, 
  UserCog, 
  Handshake,
  ChevronRight 
} from "lucide-react";
import { Link } from "wouter";

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

interface Organization {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

export default function EcoAdminOverviewPage() {
  const { data: revenueData } = useQuery<RevenueOverview>({
    queryKey: ["/api/eco-admin/revenue/overview"],
  });

  const { data: registrations } = useQuery<Organization[]>({
    queryKey: ["/api/admin/registrations", { status: "submitted" }],
  });

  const { data: allOrganizations } = useQuery<Organization[]>({
    queryKey: ["/api/admin/organizations"],
  });

  const { data: teamMembers } = useQuery<any[]>({
    queryKey: ["/api/eco-admin/team"],
  });

  const { data: partners } = useQuery<any[]>({
    queryKey: ["/api/eco-admin/partners"],
  });

  const pendingRegistrations = registrations?.length || 0;
  const totalOrganizations = allOrganizations?.length || 0;
  const teamMemberCount = teamMembers?.length || 0;
  const activePartnerCount = partners?.filter(p => p.status === "active").length || 0;

  const monthlyRevenue = revenueData?.monthlyRecurringRevenue || 0;
  const activeSubscriptions = revenueData?.totalActiveSubscriptions || 0;

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-overview">Eco Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Platform overview and key metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Revenue"
          value={`$${monthlyRevenue.toFixed(2)}`}
          icon={Coins}
          change={{ value: 12.5, trend: "up" }}
        />
        <StatCard
          title="Active Organizations"
          value={totalOrganizations.toString()}
          icon={Building2}
          change={{ value: 8.3, trend: "up" }}
        />
        <StatCard
          title="Active Subscriptions"
          value={activeSubscriptions.toString()}
          icon={Package}
        />
        <StatCard
          title="Pending Approvals"
          value={pendingRegistrations.toString()}
          icon={Users}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">Organization Registrations</CardTitle>
            <Link href="/eco-admin/registrations">
              <Button variant="ghost" size="sm" data-testid="button-view-registrations">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pendingRegistrations > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending Review</span>
                  <Badge variant="secondary" data-testid="badge-pending-count">{pendingRegistrations}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {pendingRegistrations} {pendingRegistrations === 1 ? 'organization' : 'organizations'} awaiting approval
                </p>
                <Link href="/eco-admin/registrations">
                  <Button className="w-full" data-testid="button-review-registrations">
                    Review Registrations
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">No pending registrations</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">Team & Partners</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCog className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Team Members</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold" data-testid="text-team-count">{teamMemberCount}</span>
                <Link href="/eco-admin/team">
                  <Button variant="ghost" size="sm" data-testid="link-manage-team">
                    Manage
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Handshake className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Active Partners</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold" data-testid="text-partner-count">{activePartnerCount}</span>
                <Link href="/eco-admin/partners">
                  <Button variant="ghost" size="sm" data-testid="link-manage-partners">
                    Manage
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
          <CardDescription>Monthly recurring revenue and subscription metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Monthly MRR</p>
              <p className="text-2xl font-bold" data-testid="text-monthly-mrr">
                ${monthlyRevenue.toFixed(2)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Yearly ARR</p>
              <p className="text-2xl font-bold" data-testid="text-yearly-arr">
                ${((revenueData?.yearlyRecurringRevenue || 0)).toFixed(2)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Subscriptions</p>
              <p className="text-2xl font-bold" data-testid="text-total-subscriptions">
                {revenueData?.totalSubscriptions || 0}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/eco-admin/revenue">
              <Button variant="outline" className="w-full" data-testid="button-view-revenue">
                View Detailed Revenue Analytics
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
