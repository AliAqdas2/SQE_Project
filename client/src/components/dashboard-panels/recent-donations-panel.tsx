import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";
import type { Donation } from "@shared/schema";

interface RecentDonationsPanelProps {
  orgId: string;
  enabledModules?: Array<{ module: { moduleKey: string } }>;
}

export function RecentDonationsPanel({ orgId }: RecentDonationsPanelProps) {
  const { formatCurrency } = useOrganizationLocale();

  const { data: donations } = useQuery<Donation[]>({
    queryKey: ["/api/donations", orgId],
    queryFn: async () => {
      const res = await fetch(`/api/donations?orgId=${orgId}`);
      if (!res.ok) throw new Error("Failed to fetch donations");
      return res.json();
    },
    enabled: !!orgId,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Donations</CardTitle>
      </CardHeader>
      <CardContent>
        {donations && donations.length > 0 ? (
          <div className="space-y-4">
            {donations.slice(0, 5).map((donation) => (
              <div
                key={donation.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <p className="font-medium">{donation.donorName || "Anonymous"}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(donation.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="font-semibold text-primary">
                  {formatCurrency(parseFloat(donation.amount))}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No donations yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
