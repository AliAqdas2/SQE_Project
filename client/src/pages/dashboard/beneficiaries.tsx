import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Plus, Search, Heart, Coins, TrendingUp, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";

interface Beneficiary {
  id: string;
  type: string;
  firstName: string | null;
  lastName: string | null;
  organizationName: string | null;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  status: string;
  urgencyLevel: string;
  totalDonationsReceived: string;
  totalGiftsReceived: number;
  tags: string[];
}

interface SessionResponse {
  user: {
    id: string;
    orgId: string;
  };
}

export default function BeneficiariesPage() {
  const { formatCurrency } = useOrganizationLocale();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");

  const { data: session } = useQuery<SessionResponse>({
    queryKey: ["/api/auth/session"],
  });

  const orgId = session?.user?.orgId;

  const queryParams = new URLSearchParams();
  if (searchQuery) queryParams.append("search", searchQuery);
  if (typeFilter !== "all") queryParams.append("type", typeFilter);
  if (statusFilter !== "all") queryParams.append("status", statusFilter);
  if (urgencyFilter !== "all") queryParams.append("urgencyLevel", urgencyFilter);
  const queryString = queryParams.toString();

  const { data: beneficiaries, isLoading } = useQuery<Beneficiary[]>({
    queryKey: [`/api/org/${orgId}/beneficiaries${queryString ? `?${queryString}` : ""}`],
    enabled: !!orgId,
  });

  const beneficiaryList = beneficiaries || [];

  const stats = {
    total: beneficiaryList.length,
    active: beneficiaryList.filter(b => b.status === "active").length,
    totalDonations: beneficiaryList.reduce((sum, b) => sum + parseFloat(b.totalDonationsReceived || "0"), 0),
    totalGifts: beneficiaryList.reduce((sum, b) => sum + b.totalGiftsReceived, 0),
  };

  const getDisplayName = (beneficiary: Beneficiary) => {
    if (beneficiary.type === "organization") {
      return beneficiary.organizationName || "Unnamed Organization";
    }
    return `${beneficiary.firstName || ""} ${beneficiary.lastName || ""}`.trim() || "Unnamed Individual";
  };

  const getInitials = (beneficiary: Beneficiary) => {
    if (beneficiary.type === "organization") {
      return beneficiary.organizationName?.charAt(0).toUpperCase() || "O";
    }
    const first = beneficiary.firstName?.charAt(0) || "";
    const last = beneficiary.lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "B";
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case "critical": return "destructive";
      case "high": return "default";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold truncate">Beneficiaries</h1>
          <p className="text-sm md:text-base text-muted-foreground hidden sm:block">
            Track and support individuals and organizations in need
          </p>
        </div>
        <Link href="/dashboard/beneficiaries/create">
          <Button data-testid="button-create-beneficiary" className="w-full sm:w-auto shrink-0">
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Add Beneficiary</span>
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Beneficiaries</p>
                <p className="text-2xl font-bold" data-testid="stat-total">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold" data-testid="stat-active">{stats.active}</p>
              </div>
              <Heart className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Distributed</p>
                <p className="text-2xl font-bold" data-testid="stat-total-donations">{formatCurrency(stats.totalDonations)}</p>
              </div>
              <Coins className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Gifts</p>
                <p className="text-2xl font-bold" data-testid="stat-total-gifts">{stats.totalGifts}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search beneficiaries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-type-filter">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="individual">Individual</SelectItem>
            <SelectItem value="organization">Organization</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-urgency-filter">
            <SelectValue placeholder="Filter by urgency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Urgency</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {beneficiaryList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 md:py-16 px-4">
            <Users className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg md:text-xl font-semibold mb-2 text-center">
              No Beneficiaries Yet
            </h3>
            <p className="text-sm md:text-base text-muted-foreground text-center mb-6 max-w-md">
              Start tracking beneficiaries to better manage and support those in need.
            </p>
            <Link href="/dashboard/beneficiaries/create">
              <Button data-testid="button-create-first-beneficiary" size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Add First Beneficiary
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {beneficiaryList.map((beneficiary) => (
            <Link key={beneficiary.id} href={`/dashboard/beneficiaries/${beneficiary.id}`}>
              <Card className="hover-elevate active-elevate-2" data-testid={`card-beneficiary-${beneficiary.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarImage src={beneficiary.photoUrl || undefined} />
                      <AvatarFallback>{getInitials(beneficiary)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold truncate" data-testid={`text-name-${beneficiary.id}`}>
                          {getDisplayName(beneficiary)}
                        </h3>
                        <Badge variant={getUrgencyColor(beneficiary.urgencyLevel)} className="shrink-0">
                          {beneficiary.urgencyLevel}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {beneficiary.type}
                          </Badge>
                          <Badge variant={beneficiary.status === "active" ? "default" : "secondary"} className="text-xs">
                            {beneficiary.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Coins className="h-3 w-3" />
                            {formatCurrency(parseFloat(beneficiary.totalDonationsReceived || "0"))}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {beneficiary.totalGiftsReceived} gifts
                          </span>
                        </div>
                        {beneficiary.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {beneficiary.tags.slice(0, 2).map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {beneficiary.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{beneficiary.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
