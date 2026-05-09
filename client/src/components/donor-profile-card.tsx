import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Calendar } from "lucide-react";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";

interface DonorProfileCardProps {
  name: string;
  email: string;
  phone?: string;
  totalDonated: number;
  donationCount: number;
  lastDonation: string;
  tier?: "bronze" | "silver" | "gold" | "platinum";
  avatarUrl?: string;
}

export function DonorProfileCard({
  name,
  email,
  phone,
  totalDonated,
  donationCount,
  lastDonation,
  tier = "bronze",
  avatarUrl,
}: DonorProfileCardProps) {
  const { formatCurrency } = useOrganizationLocale();
  const getTierColor = (tier: string) => {
    const colors = {
      bronze: "bg-amber-700",
      silver: "bg-gray-400",
      gold: "bg-yellow-500",
      platinum: "bg-purple-500",
    };
    return colors[tier as keyof typeof colors] || colors.bronze;
  };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <Card className="hover-elevate">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback className="text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold" data-testid="text-donor-name">
              {name}
            </h3>
            <Badge variant="secondary" className={getTierColor(tier)}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)} Donor
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Donated</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(totalDonated)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Donations</p>
            <p className="text-2xl font-bold">{donationCount}</p>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{email}</span>
          </div>
          {phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Last donation: {lastDonation}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
