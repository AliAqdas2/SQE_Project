import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Search, Filter, Plus, Download, Receipt, Mail, Edit, Upload, Send, Loader2, FileText, ExternalLink, CheckCircle2, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getDonationCategories } from "@shared/constants";
import type { DonationWithDonor } from "@shared/schema";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";
import { formatCurrency as formatCurrencyByCode } from "@/lib/format-utils";

interface Organization {
  id: string;
  name: string;
  religion?: string;
}

export default function DonationsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { formatCurrency, formatDate } = useOrganizationLocale();
  const [searchQuery, setSearchQuery] = useState("");
  const [donationType, setDonationType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<DonationWithDonor | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editReceiptUrl, setEditReceiptUrl] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [thankYouMessage, setThankYouMessage] = useState("");

  // Get orgId from session
  const { data: session } = useQuery<{ user: { orgId: string } }>({
    queryKey: ["/api/auth/session"],
  });

  const orgId = session?.user?.orgId;

  // Fetch organization for religion-based categories and country
  const { data: organization } = useQuery<Organization & { country?: string }>({
    queryKey: [`/api/org/${orgId}`],
    enabled: !!orgId,
  });
  
  const isUK = organization?.country === "GB";

  // Get donation categories based on organization's religion
  const donationCategories = getDonationCategories(organization?.religion);

  // Fetch donations with filters
  const queryParams = new URLSearchParams();
  if (donationType !== "all") queryParams.append("donationType", donationType);
  if (dateFrom) queryParams.append("startDate", dateFrom);
  if (dateTo) queryParams.append("endDate", dateTo);

  const { data: donations, isLoading } = useQuery<DonationWithDonor[]>({
    queryKey: [`/api/org/${orgId}/donations?${queryParams.toString()}`],
    enabled: !!orgId,
  });

  // Client-side search filtering
  const filteredDonations = useMemo(() => {
    if (!donations) return [];

    return donations.filter((donation) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const donorName = `${donation.donor?.firstName} ${donation.donor?.lastName}`.toLowerCase();
        const matchesSearch = 
          donorName.includes(query) ||
          donation.donor?.email?.toLowerCase().includes(query) ||
          donation.amount.includes(query) ||
          donation.donationType.toLowerCase().includes(query) ||
          donation.notes?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [donations, searchQuery]);

  // Calculate active filters count
  const activeFiltersCount = [
    donationType !== "all",
    dateFrom,
    dateTo,
  ].filter(Boolean).length;

  // Calculate total amount
  const totalAmount = useMemo(() => {
    if (!filteredDonations) return "0.00";
    const total = filteredDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
    return total.toFixed(2);
  }, [filteredDonations]);

  const handleClearFilters = () => {
    setDonationType("all");
    setDateFrom("");
    setDateTo("");
  };

  const handleExport = () => {
    // Simple CSV export
    if (!filteredDonations || filteredDonations.length === 0) return;

    const headers = ["Date", "Donor", "Type", "Category", "Amount", "Currency", "Thank You Sent", "Notes"];
    const csvContent = [
      headers.join(","),
      ...filteredDonations.map(d => [
        format(new Date(d.createdAt), "yyyy-MM-dd"),
        `${d.donor?.firstName} ${d.donor?.lastName}`,
        d.donationType,
        d.category || "",
        d.amount,
        d.currency,
        d.thankYouSent ? "Yes" : "No",
        d.notes || ""
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `donations-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  // Open edit dialog with donation data
  const openEditDialog = (donation: DonationWithDonor) => {
    setSelectedDonation(donation);
    setEditAmount(donation.amount);
    setEditCategory(donation.category || "");
    setEditNotes(donation.notes || "");
    setEditReceiptUrl(donation.receiptUrl || "");
    setThankYouMessage("");
    setEditDialogOpen(true);
  };

  // Update donation mutation
  const updateDonationMutation = useMutation({
    mutationFn: async (data: { amount: string; category: string; notes: string; receiptUrl: string }) => {
      if (!selectedDonation || !orgId) throw new Error("Missing data");
      // Send all editable fields explicitly with proper null handling
      // The backend uses decimal() for amount which accepts string format
      const payload = {
        amount: data.amount, // Keep as string - backend decimal type accepts this
        category: data.category || null, // Explicitly null if empty to clear
        notes: data.notes || null, // Explicitly null if empty to clear
        receiptUrl: data.receiptUrl || null, // Explicitly null if empty to clear
      };
      const response = await apiRequest("PATCH", `/api/org/${orgId}/donations/${selectedDonation.id}`, payload);
      return response.json();
    },
    onSuccess: (updatedDonation) => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === 'string' &&
          query.queryKey[0].includes('/donations')
      });
      toast({
        title: "Success",
        description: "Donation updated successfully",
      });
      // Update local state with saved data, preserving the donor join from original selection
      if (updatedDonation && selectedDonation) {
        // Merge response with existing donor info (response doesn't include donor join)
        setSelectedDonation({
          ...updatedDonation,
          donor: selectedDonation.donor,
        });
        // Sync form fields with saved data
        setEditAmount(updatedDonation.amount);
        setEditCategory(updatedDonation.category || "");
        setEditNotes(updatedDonation.notes || "");
        setEditReceiptUrl(updatedDonation.receiptUrl || "");
      }
      setEditDialogOpen(false);
    },
    onError: (error: Error) => {
      // Keep dialog open on error so user can fix and retry
      // Refetch donations to get fresh data
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === 'string' &&
          query.queryKey[0].includes('/donations')
      });
      toast({
        title: "Error",
        description: error.message || "Failed to update donation",
        variant: "destructive",
      });
    },
  });

  // Send thank you email mutation
  const sendThankYouMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDonation) throw new Error("No donation selected");
      const response = await apiRequest("POST", `/api/donations/${selectedDonation.id}/resend-thank-you`, {
        customMessage: thankYouMessage || undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === 'string' &&
          query.queryKey[0].includes('/donations')
      });
      toast({
        title: "Email Sent",
        description: "Thank you email has been sent to the donor",
      });
      // Update local state to reflect email sent
      if (selectedDonation) {
        setSelectedDonation({ ...selectedDonation, thankYouSent: true });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send thank you email",
        variant: "destructive",
      });
    },
  });

  // Handle receipt file upload
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orgId) return;

    setUploadingReceipt(true);
    try {
      const formData = new FormData();
      formData.append("receipt", file);

      const response = await fetch(`/api/org/${orgId}/donations/upload-receipt`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload receipt");
      }

      const { url } = await response.json();
      setEditReceiptUrl(url);
      toast({
        title: "Success",
        description: "Receipt uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload receipt",
        variant: "destructive",
      });
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSaveChanges = () => {
    // Validate amount before saving
    const amountValue = parseFloat(editAmount);
    if (!editAmount || isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid amount greater than zero",
        variant: "destructive",
      });
      return;
    }
    
    updateDonationMutation.mutate({
      amount: amountValue.toFixed(2), // Ensure proper decimal format
      category: editCategory,
      notes: editNotes,
      receiptUrl: editReceiptUrl,
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <Breadcrumbs items={[{ label: "Donations" }]} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Donations Journal</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Track and manage all donations
          </p>
        </div>
        <Button onClick={() => navigate("/dashboard/donations/new")} className="w-full sm:w-auto" data-testid="button-add-donation">
          <Plus className="h-4 w-4 mr-2" />
          Add Donation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Donations</CardTitle>
              <CardDescription>
                {filteredDonations?.length || 0} donations • Total: {formatCurrency(parseFloat(totalAmount))}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={handleExport} data-testid="button-export-donations">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by donor name, email, amount, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-donations"
              />
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              data-testid="button-toggle-filters"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Donation Type</label>
                <Select value={donationType} onValueChange={setDonationType}>
                  <SelectTrigger data-testid="select-donation-type-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="campaign">Campaign</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="in-kind">In-Kind</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">From Date</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  data-testid="input-date-from"
                />
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">To Date</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  data-testid="input-date-to"
                />
              </div>

              {activeFiltersCount > 0 && (
                <div className="flex items-end">
                  <Button variant="outline" onClick={handleClearFilters} data-testid="button-clear-filters">
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredDonations && filteredDonations.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Donor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    {isUK && <TableHead>Gift Aid</TableHead>}
                    <TableHead>Receipt</TableHead>
                    <TableHead>Thank You</TableHead>
                    <TableHead>Internal Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDonations.map((donation) => (
                    <TableRow key={donation.id} data-testid={`row-donation-${donation.id}`}>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(donation.createdAt), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {donation.donor?.firstName} {donation.donor?.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {donation.donor?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={
                            donation.donationType === "one-time" 
                              ? "bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                              : donation.donationType === "recurring"
                              ? "bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700"
                              : donation.donationType === "pledge"
                              ? "bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700"
                              : ""
                          }
                        >
                          {donation.donationType.charAt(0).toUpperCase() + donation.donationType.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {donation.category ? (
                          <Badge variant="secondary">
                            {donation.category}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrencyByCode(parseFloat(donation.amount), donation.currency || "USD")}
                        </div>
                      </TableCell>
                      {isUK && (
                        <TableCell>
                          {donation.giftAidOptIn && donation.taxReliefAmount ? (
                            <div className="space-y-1">
                              <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
                                Gift Aid
                              </Badge>
                              <div className="text-xs text-muted-foreground">
                                +{formatCurrencyByCode(parseFloat(donation.taxReliefAmount), donation.currency || "USD")}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        {donation.receiptUrl ? (
                          <a
                            href={donation.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                            data-testid={`link-receipt-${donation.id}`}
                          >
                            <Paperclip className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {donation.thankYouSent ? (
                          <Badge className="bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700" variant="outline">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Sent
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground max-w-[200px] truncate" title={donation.notes || undefined}>
                          {donation.notes || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(donation)}
                          data-testid={`button-edit-donation-${donation.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <Receipt className="h-12 w-12 opacity-50" />
                <p>No donations found</p>
                <Button variant="outline" onClick={() => navigate("/dashboard/donations/new")} data-testid="button-add-first-donation">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Donation
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Donation Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Donation</DialogTitle>
            <DialogDescription>
              Update donation details, upload receipts, or send a thank you email.
            </DialogDescription>
          </DialogHeader>

          {selectedDonation && (
            <div className="space-y-6">
              {/* Donor Info (read-only) */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {selectedDonation.donor?.firstName?.[0] || selectedDonation.donorName?.[0] || "?"}
                      {selectedDonation.donor?.lastName?.[0] || ""}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {selectedDonation.donor 
                        ? `${selectedDonation.donor.firstName} ${selectedDonation.donor.lastName}`
                        : selectedDonation.donorName || "Unknown Donor"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDonation.donor?.email || selectedDonation.donorEmail || "No email"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-amount">Amount</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{selectedDonation.currency}</span>
                      <Input
                        id="edit-amount"
                        type="number"
                        step="0.01"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        data-testid="input-edit-amount"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <Select value={editCategory} onValueChange={setEditCategory}>
                      <SelectTrigger id="edit-category" data-testid="select-edit-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {donationCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Internal Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Add internal notes about this donation (not visible to donors)..."
                    className="resize-none"
                    rows={4}
                    data-testid="textarea-edit-notes"
                  />
                </div>

                {/* Receipt Upload Section */}
                <div className="space-y-2">
                  <Label>Receipt</Label>
                  <div className="border rounded-lg p-4 space-y-3">
                    {editReceiptUrl ? (
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium">Receipt uploaded</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={editReceiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditReceiptUrl("")}
                            className="text-destructive hover:text-destructive"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground text-sm py-2">
                        No receipt uploaded
                      </div>
                    )}
                    <div className="flex justify-center">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleReceiptUpload}
                          disabled={uploadingReceipt}
                          data-testid="input-upload-receipt"
                        />
                        <Button variant="outline" size="sm" asChild disabled={uploadingReceipt}>
                          <span>
                            {uploadingReceipt ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                {editReceiptUrl ? "Replace Receipt" : "Upload Receipt"}
                              </>
                            )}
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Thank You Email Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Thank You Email</Label>
                  {selectedDonation.thankYouSent && (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Sent
                    </Badge>
                  )}
                </div>
                
                <Textarea
                  value={thankYouMessage}
                  onChange={(e) => setThankYouMessage(e.target.value)}
                  placeholder="Add a personal message to include in the thank you email (optional)..."
                  className="resize-none"
                  rows={3}
                  data-testid="textarea-thank-you-message"
                />

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => sendThankYouMutation.mutate()}
                  disabled={sendThankYouMutation.isPending || !(selectedDonation.donor?.email || selectedDonation.donorEmail)}
                  data-testid="button-send-thank-you"
                >
                  {sendThankYouMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {selectedDonation.thankYouSent ? "Resend Thank You Email" : "Send Thank You Email"}
                    </>
                  )}
                </Button>
                
                {!(selectedDonation.donor?.email || selectedDonation.donorEmail) && (
                  <p className="text-sm text-muted-foreground text-center">
                    No email address available for this donor
                  </p>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveChanges}
                  disabled={updateDonationMutation.isPending}
                  data-testid="button-save-donation"
                >
                  {updateDonationMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
