import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Coins, TrendingUp, UserPlus, Search } from "lucide-react";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";
import type { Donor } from "@shared/schema";

export default function DonorsPage() {
  const { formatCurrency } = useOrganizationLocale();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");

  // Get orgId from session
  const { data: session } = useQuery<{ user: { orgId: string } }>({
    queryKey: ["/api/auth/session"],
    enabled: true,
  });

  const orgId = session?.user?.orgId;

  // Fetch donors
  const { data: donors, isLoading } = useQuery<Donor[]>({
    queryKey: [`/api/donors?orgId=${orgId}`],
    enabled: !!orgId,
  });

  // Calculate stats
  const stats = {
    total: donors?.length || 0,
    totalDonated: donors?.reduce((sum, d) => sum + parseFloat(d.totalDonated), 0) || 0,
    avgDonation: donors?.length 
      ? (donors.reduce((sum, d) => sum + parseFloat(d.totalDonated), 0) / donors.length) 
      : 0,
    recurring: donors?.filter(d => d.donationCount > 1).length || 0,
  };

  // Filter donors
  const filteredDonors = donors?.filter(donor => {
    const matchesSearch = 
      `${donor.firstName} ${donor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donor.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTier = tierFilter === "all" || donor.tier === tierFilter;
    
    return matchesSearch && matchesTier;
  }) || [];

  const tierColors = {
    bronze: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    silver: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-800",
    gold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    platinum: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  };

  if (isLoading || !orgId) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Donors</h1>
          <p className="text-sm text-muted-foreground">
            Manage your donor relationships and giving history
          </p>
        </div>
        <Button 
          onClick={() => navigate("/dashboard/donors/create")}
          data-testid="button-create-donor" 
          className="w-full sm:w-auto shrink-0"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Donor
        </Button>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="stat-total">{stats.total}</p>
            <p className="text-xs text-muted-foreground mt-1">
              All registered donors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donated</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="stat-total-donated">
              {formatCurrency(stats.totalDonated)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime giving
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Donation</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="stat-avg-donation">
              {formatCurrency(stats.avgDonation)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Per donor average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repeat Donors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="stat-recurring">{stats.recurring}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Multiple donations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-tier-filter">
            <SelectValue placeholder="Filter by tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="bronze">Bronze</SelectItem>
            <SelectItem value="silver">Silver</SelectItem>
            <SelectItem value="gold">Gold</SelectItem>
            <SelectItem value="platinum">Platinum</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Donors Grid */}
      {filteredDonors.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDonors.map((donor) => (
            <Link key={donor.id} href={`/dashboard/donors/${donor.id}`} data-testid={`link-donor-${donor.id}`}>
              <Card className="hover-elevate cursor-pointer" data-testid={`card-donor-${donor.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {donor.firstName[0]}{donor.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold truncate" data-testid={`text-name-${donor.id}`}>
                            {donor.firstName} {donor.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate" data-testid={`text-email-${donor.id}`}>
                            {donor.email}
                          </p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={tierColors[donor.tier as keyof typeof tierColors] || tierColors.bronze}
                          data-testid={`badge-tier-${donor.id}`}
                        >
                          {donor.tier.charAt(0).toUpperCase() + donor.tier.slice(1)}
                        </Badge>
                      </div>
                      
                      {donor.phone && (
                        <p className="text-xs text-muted-foreground mb-2" data-testid={`text-phone-${donor.id}`}>
                          {donor.phone}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Donated</p>
                          <p className="text-base font-semibold" data-testid={`text-donated-${donor.id}`}>
                            {formatCurrency(parseFloat(donor.totalDonated))}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Donations</p>
                          <p className="text-base font-semibold" data-testid={`text-count-${donor.id}`}>
                            {donor.donationCount}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            {donors && donors.length > 0 ? (
              <>
                <h3 className="font-semibold text-lg mb-1">No donors match your filters</h3>
                <p className="text-muted-foreground text-sm text-center mb-4">
                  Try adjusting your search or filter criteria
                </p>
              </>
            ) : (
              <>
                <h3 className="font-semibold text-lg mb-1">No donors yet</h3>
                <p className="text-muted-foreground text-sm text-center mb-4">
                  Start building relationships by adding your first donor
                </p>
                <Button 
                  onClick={() => navigate("/dashboard/donors/create")}
                  data-testid="button-create-first-donor"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Your First Donor
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
