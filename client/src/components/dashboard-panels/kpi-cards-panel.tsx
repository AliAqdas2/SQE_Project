import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/stat-card";
import { Coins, Users, TrendingUp, Heart } from "lucide-react";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";
import type { Campaign, Donation, Donor } from "@shared/schema";

interface KPICardsPanelProps {
  orgId: string;
  enabledModules?: Array<{ module: { moduleKey: string } }>;
}

export function KPICardsPanel({ orgId }: KPICardsPanelProps) {
  const { formatCurrency } = useOrganizationLocale();

  const { data: campaigns } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns", orgId],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns?orgId=${orgId}`);
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      return res.json();
    },
    enabled: !!orgId,
  });

  const { data: donations } = useQuery<Donation[]>({
    queryKey: ["/api/donations", orgId],
    queryFn: async () => {
      const res = await fetch(`/api/donations?orgId=${orgId}`);
      if (!res.ok) throw new Error("Failed to fetch donations");
      return res.json();
    },
    enabled: !!orgId,
  });

  const { data: donors } = useQuery<Donor[]>({
    queryKey: ["/api/donors", orgId],
    queryFn: async () => {
      const res = await fetch(`/api/donors?orgId=${orgId}`);
      if (!res.ok) throw new Error("Failed to fetch donors");
      return res.json();
    },
    enabled: !!orgId,
  });

  const totalRaised = campaigns?.reduce(
    (sum, c) => sum + parseFloat(c.currentAmount),
    0
  ) || 0;

  const donorCount = donors?.length || 0;
  const campaignCount = campaigns?.length || 0;

  const thisMonthDonations = donations?.filter((d) => {
    const donationDate = new Date(d.createdAt);
    const now = new Date();
    return (
      donationDate.getMonth() === now.getMonth() &&
      donationDate.getFullYear() === now.getFullYear()
    );
  }) || [];

  const thisMonthTotal = thisMonthDonations.reduce(
    (sum, d) => sum + parseFloat(d.amount),
    0
  ) || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Raised"
        value={formatCurrency(totalRaised)}
        change={{ value: 12.5, trend: "up" }}
        icon={Coins}
      />
      <StatCard
        title="Active Donors"
        value={donorCount.toString()}
        change={{ value: 8.2, trend: "up" }}
        icon={Users}
      />
      <StatCard
        title="Campaigns"
        value={campaignCount.toString()}
        icon={TrendingUp}
      />
      <StatCard
        title="This Month"
        value={formatCurrency(thisMonthTotal)}
        change={{ value: 3.1, trend: "down" }}
        icon={Heart}
      />
    </div>
  );
}
