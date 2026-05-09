import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard } from "@/contexts/dashboard-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart } from "lucide-react";
import { format } from "date-fns";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";

interface BeneficiaryAnalytics {
  totalBeneficiaries: number;
  supported: number;
  totalDistributed: number;
  newBeneficiaries: number;
}

export function BeneficiariesWidget({ orgId }: { orgId: string }) {
  const { dateRange } = useDashboard();
  const { formatCurrency } = useOrganizationLocale();

  const { data, isLoading } = useQuery<BeneficiaryAnalytics>({
    queryKey: ["/api/org", orgId, "analytics/beneficiaries", dateRange.from, dateRange.to],
    enabled: !!orgId,
  });

  if (isLoading) {
    return (
      <Card data-testid="widget-beneficiaries">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Beneficiaries
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
      <Card data-testid="widget-beneficiaries">
        <CardHeader>
          <CardTitle>Beneficiaries</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No beneficiary data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="widget-beneficiaries" className="hover-elevate">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5" />
          Beneficiaries
        </CardTitle>
        <CardDescription>
          {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold" data-testid="text-total-beneficiaries">{data.totalBeneficiaries}</p>
            <p className="text-xs text-muted-foreground">Total Beneficiaries</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">+{data.newBeneficiaries}</p>
            <p className="text-xs text-muted-foreground">New</p>
          </div>
        </div>

        <div className="p-3 rounded-md bg-muted/50">
          <p className="text-sm text-muted-foreground">Support Distributed</p>
          <p className="text-xl font-semibold">{formatCurrency(data.totalDistributed)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.supported} beneficiaries supported
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
