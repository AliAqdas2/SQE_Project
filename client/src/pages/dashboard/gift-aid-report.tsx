import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Download, FileText, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";
import { formatCurrency as formatCurrencyByCode } from "@/lib/format-utils";

interface GiftAidDonation {
  id: string;
  donorName?: string;
  donorEmail?: string;
  donorAddress?: string;
  donorCity?: string;
  donorPostcode?: string;
  amount: string;
  currency: string;
  category?: string;
  taxReliefAmount?: string | null;
  giftAidOptIn?: boolean;
  giftAidEligible?: boolean;
  taxReliefClaimed?: boolean;
  taxReliefClaimedAt?: Date | string | null;
  createdAt: Date | string;
  donor?: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

interface Organization {
  id: string;
  name: string;
  country: string;
}

export default function GiftAidReportPage() {
  const { toast } = useToast();
  const { formatCurrency, formatDate } = useOrganizationLocale();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch organization details
  const { data: org } = useQuery<Organization>({
    queryKey: ["/api/me"],
    select: (data: any) => data.organization,
  });

  // Fetch Gift Aid donations
  const { data: donations = [], isLoading } = useQuery<GiftAidDonation[]>({
    queryKey: ["/api/donations/gift-aid", startDate, endDate],
    queryFn: async () => {
      let url = "/api/donations/gift-aid";
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch Gift Aid donations");
      return res.json();
    },
  });

  // Mark donations as claimed
  const markAsClaimedMutation = useMutation({
    mutationFn: async (donationIds: string[]) =>
      apiRequest("POST", "/api/donations/gift-aid/claim", { donationIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/donations/gift-aid"] });
      toast({
        title: "Marked as Claimed",
        description: "Selected donations have been marked as claimed for tax relief",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Export to CSV
  const exportToCSV = () => {
    if (donations.length === 0) {
      toast({
        title: "No Data",
        description: "There are no donations to export",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Date", "Donor Name", "Email", "Address", "City", "Postcode", "Amount", "Tax Relief", "Status"];
    const rows = donations.map(d => {
      const donorName = d.donor ? `${d.donor.firstName} ${d.donor.lastName}` : d.donorName || "Unknown";
      const donorEmail = d.donor?.email || d.donorEmail || "";
      const donorAddress = d.donorAddress || "";
      const donorCity = d.donorCity || "";
      const donorPostcode = d.donorPostcode || "";
      
      return [
        new Date(d.createdAt).toLocaleDateString(),
        donorName,
        donorEmail,
        donorAddress,
        donorCity,
        donorPostcode,
        formatCurrencyByCode(parseFloat(d.amount), d.currency || "USD"),
        d.taxReliefAmount ? formatCurrencyByCode(parseFloat(d.taxReliefAmount), d.currency || "USD") : "",
        d.taxReliefClaimed ? "Claimed" : "Pending",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `gift-aid-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: "Export Successful",
      description: "Gift Aid report has been exported to CSV",
    });
  };

  // Calculate totals
  const totalDonations = donations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
  const totalTaxRelief = donations.reduce((sum, d) => sum + (d.taxReliefAmount ? parseFloat(d.taxReliefAmount) : 0), 0);
  const claimedDonations = donations.filter(d => d.taxReliefClaimed);
  const pendingDonations = donations.filter(d => !d.taxReliefClaimed);
  const totalClaimed = claimedDonations.reduce((sum, d) => sum + (d.taxReliefAmount ? parseFloat(d.taxReliefAmount) : 0), 0);
  const totalPending = pendingDonations.reduce((sum, d) => sum + (d.taxReliefAmount ? parseFloat(d.taxReliefAmount) : 0), 0);

  // Get tax relief program name
  const getTaxReliefName = () => {
    if (org?.country === "GB") return "Gift Aid";
    if (org?.country === "US") return "Tax Deduction";
    if (org?.country === "CA") return "Tax Credit";
    if (org?.country === "AU") return "Tax Deduction";
    return "Tax Relief";
  };

  const [selectedDonations, setSelectedDonations] = useState<string[]>([]);

  const toggleSelection = (donationId: string) => {
    setSelectedDonations(prev =>
      prev.includes(donationId)
        ? prev.filter(id => id !== donationId)
        : [...prev, donationId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedDonations.length === pendingDonations.length) {
      setSelectedDonations([]);
    } else {
      setSelectedDonations(pendingDonations.map(d => d.id));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: `${getTaxReliefName()} Report`, href: "/dashboard/gift-aid-report" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{getTaxReliefName()} Report</h1>
          <p className="text-muted-foreground">
            View and manage {getTaxReliefName().toLowerCase()} eligible donations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV} data-testid="button-export-csv">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          {selectedDonations.length > 0 && (
            <Button
              onClick={() => markAsClaimedMutation.mutate(selectedDonations)}
              disabled={markAsClaimedMutation.isPending}
              data-testid="button-mark-claimed"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark {selectedDonations.length} as Claimed
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{donations.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalDonations)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tax Relief</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalTaxRelief)}
            </div>
            <p className="text-xs text-muted-foreground">
              Available to claim
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Claimed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalClaimed)}
            </div>
            <p className="text-xs text-muted-foreground">
              {claimedDonations.length} donations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalPending)}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingDonations.length} donations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Donations</CardTitle>
          <CardDescription>Filter by date range to view specific periods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Donations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Donations</CardTitle>
              <CardDescription>
                {donations.length} {getTaxReliefName().toLowerCase()} eligible donations
              </CardDescription>
            </div>
            {pendingDonations.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                data-testid="button-select-all"
              >
                {selectedDonations.length === pendingDonations.length ? "Deselect All" : "Select All Pending"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : donations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No {getTaxReliefName().toLowerCase()} eligible donations found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Donor</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Tax Relief</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell>
                        {!donation.taxReliefClaimed && (
                          <input
                            type="checkbox"
                            checked={selectedDonations.includes(donation.id)}
                            onChange={() => toggleSelection(donation.id)}
                            data-testid={`checkbox-donation-${donation.id}`}
                            className="h-4 w-4"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(donation.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {donation.donor 
                              ? `${donation.donor.firstName} ${donation.donor.lastName}`
                              : donation.donorName || "Unknown Donor"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {donation.donor?.email || donation.donorEmail || "No email"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {donation.donorAddress && <div>{donation.donorAddress}</div>}
                          {donation.donorCity && donation.donorPostcode && (
                            <div>{donation.donorCity}, {donation.donorPostcode}</div>
                          )}
                          {!donation.donorAddress && !donation.donorCity && !donation.donorPostcode && (
                            <span className="text-muted-foreground">No address</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrencyByCode(parseFloat(donation.amount), donation.currency || "USD")}
                      </TableCell>
                      <TableCell>
                        {donation.taxReliefAmount && (
                          <span className="font-medium">
                            {formatCurrencyByCode(parseFloat(donation.taxReliefAmount), donation.currency || "USD")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {donation.taxReliefClaimed ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Claimed
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
