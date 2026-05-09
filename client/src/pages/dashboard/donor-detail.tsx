import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Coins, 
  Calendar, 
  TrendingUp, 
  Ticket, 
  Video, 
  Users, 
  Tag,
  Plus,
  X,
  MapPin,
  Upload,
  Send,
  Loader2,
  FileText,
  ExternalLink,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDonationCategories } from "@shared/constants";
import type { Donor, Donation, EventRegistration, Event, LivestreamDonation, Livestream, ActivityRegistration, Activity, DonorTag, DonationWithDonor } from "@shared/schema";
import { formatCurrency as formatCurrencyByCode } from "@/lib/format-utils";

interface DonorTagAssignment {
  id: string;
  tagId: string;
  tag: DonorTag;
  createdAt: string;
}

interface DonorInteractions {
  donations: Donation[];
  eventRegistrations: (EventRegistration & { event?: Event })[];
  livestreamDonations: (LivestreamDonation & { livestream?: Livestream })[];
  activityRegistrations: (ActivityRegistration & { activity?: Activity })[];
}

export default function DonorDetailPage() {
  const [, params] = useRoute("/dashboard/donors/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { formatCurrency } = useOrganizationLocale();
  const donorId = params?.id;
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3B82F6");
  
  // Donation dialog state
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
    enabled: true,
  });

  const orgId = session?.user?.orgId;

  // Fetch organization for religion-based categories
  const { data: organization } = useQuery<{ religion?: string }>({
    queryKey: [`/api/org/${orgId}`],
    enabled: !!orgId,
  });

  // Get donation categories based on organization's religion
  const donationCategories = getDonationCategories(organization?.religion);

  // Fetch donor
  const { data: donor, isLoading: donorLoading } = useQuery<Donor>({
    queryKey: [`/api/donors/${donorId}`],
    enabled: !!donorId,
  });

  // Fetch all donor interactions
  const { data: interactions, isLoading: interactionsLoading } = useQuery<DonorInteractions>({
    queryKey: [`/api/donors/${donorId}/interactions`],
    enabled: !!donorId,
  });

  // Fetch donor tags
  const { data: donorTags = [] } = useQuery<DonorTagAssignment[]>({
    queryKey: [`/api/donors/${donorId}/tags`],
    enabled: !!donorId,
  });

  // Fetch all available tags
  const { data: availableTags = [] } = useQuery<DonorTag[]>({
    queryKey: ["/api/donor-tags"],
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/donors/${donorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/donors?orgId=${orgId}`] });
      toast({ title: "Donor deleted successfully" });
      navigate("/dashboard/donors");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete donor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const assignTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      return apiRequest("POST", `/api/donors/${donorId}/tags`, { tagId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/donors/${donorId}/tags`] });
      toast({ title: "Tag assigned successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to assign tag",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      return apiRequest("DELETE", `/api/donors/${donorId}/tags/${tagId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/donors/${donorId}/tags`] });
      toast({ title: "Tag removed successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove tag",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createTagMutation = useMutation({
    mutationFn: async (data: { name: string; color: string; donorId: string }) => {
      // Create the tag
      const createResponse = await apiRequest("POST", "/api/donor-tags", {
        name: data.name,
        color: data.color,
      });
      const newTag = await createResponse.json();
      
      // Auto-assign the tag to the donor
      await apiRequest("POST", `/api/donors/${data.donorId}/tags`, { tagId: newTag.id });
      
      return newTag;
    },
    onSuccess: () => {
      // Invalidate both queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["/api/donor-tags"] });
      queryClient.invalidateQueries({ queryKey: [`/api/donors/${donorId}/tags`] });
      
      toast({ title: "Tag created and assigned successfully" });
      setNewTagName("");
      setNewTagColor("#3B82F6");
      setIsCreatingTag(false);
      setIsTagDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create or assign tag",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Open edit dialog with donation data
  const openEditDialog = (donation: Donation) => {
    // Convert Donation to DonationWithDonor format
    const donationWithDonor: DonationWithDonor = {
      ...donation,
      donor: donor ? {
        firstName: donor.firstName,
        lastName: donor.lastName,
        email: donor.email,
      } : null,
    };
    setSelectedDonation(donationWithDonor);
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
      const payload = {
        amount: data.amount,
        category: data.category || null,
        notes: data.notes || null,
        receiptUrl: data.receiptUrl || null,
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
      queryClient.invalidateQueries({ queryKey: [`/api/donors/${donorId}/interactions`] });
      toast({
        title: "Success",
        description: "Donation updated successfully",
      });
      if (updatedDonation && selectedDonation) {
        setSelectedDonation({
          ...updatedDonation,
          donor: selectedDonation.donor,
        });
        setEditAmount(updatedDonation.amount);
        setEditCategory(updatedDonation.category || "");
        setEditNotes(updatedDonation.notes || "");
        setEditReceiptUrl(updatedDonation.receiptUrl || "");
      }
      setEditDialogOpen(false);
    },
    onError: (error: Error) => {
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
      amount: amountValue.toFixed(2),
      category: editCategory,
      notes: editNotes,
      receiptUrl: editReceiptUrl,
    });
  };

  const tierColors = {
    bronze: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    silver: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-800",
    gold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    platinum: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  };

  if (donorLoading || !donor) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Calculate donation stats
  const donations = interactions?.donations || [];
  const sortedDonations = [...donations].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  const firstDonation = sortedDonations[sortedDonations.length - 1];
  const lastDonation = sortedDonations[0];
  const avgDonation = donations.length 
    ? donations.reduce((sum, d) => sum + parseFloat(d.amount), 0) / donations.length
    : 0;

  // Calculate livestream donation total
  const livestreamDonationTotal = (interactions?.livestreamDonations || [])
    .reduce((sum, d) => sum + parseFloat(d.amount), 0);

  // Calculate event attendance and spending
  const eventsAttended = interactions?.eventRegistrations?.length || 0;
  const eventSpending = (interactions?.eventRegistrations || [])
    .reduce((sum, r) => sum + parseFloat(r.totalPaid), 0);

  // Get unassigned tags
  const assignedTagIds = new Set(donorTags.map(dt => dt.tagId));
  const unassignedTags = availableTags.filter(tag => !assignedTagIds.has(tag.id));

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/dashboard/donors")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold flex-1">Donor Profile</h1>
        <Button
          variant="outline"
          onClick={() => navigate(`/dashboard/donors/${donorId}/edit`)}
          data-testid="button-edit"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" data-testid="button-delete">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Donor</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this donor? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate()}
                data-testid="button-confirm-delete"
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {donor.firstName[0]}{donor.lastName[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                <div>
                  <h2 className="text-2xl font-bold mb-2" data-testid="text-name">
                    {donor.firstName} {donor.lastName}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={tierColors[donor.tier as keyof typeof tierColors] || tierColors.bronze}
                      data-testid="badge-tier"
                    >
                      {donor.tier.charAt(0).toUpperCase() + donor.tier.slice(1)} Donor
                    </Badge>
                    {donorTags.map((dt) => (
                      <Badge
                        key={dt.id}
                        variant="outline"
                        style={{ 
                          backgroundColor: `${dt.tag.color}20`,
                          borderColor: dt.tag.color,
                          color: dt.tag.color
                        }}
                        data-testid={`badge-tag-${dt.tag.name}`}
                      >
                        {dt.tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="text-sm" data-testid="text-email">{donor.email}</span>
                </div>
                {donor.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span className="text-sm" data-testid="text-phone">{donor.phone}</span>
                  </div>
                )}
                {donor.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="text-sm" data-testid="text-address">{donor.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donated</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="stat-total-donated">
              {formatCurrency(parseFloat(donor.totalDonated))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {donor.donationCount} donations
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
              {formatCurrency(avgDonation)}
            </p>
            {lastDonation && (
              <p className="text-xs text-muted-foreground mt-1">
                Last: {new Date(lastDonation.createdAt).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Attended</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="stat-events-attended">
              {eventsAttended}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(eventSpending)} spent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-base font-semibold" data-testid="stat-member-since">
              {new Date(donor.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
            {firstDonation && (
              <p className="text-xs text-muted-foreground mt-1">
                First donation: {new Date(firstDonation.createdAt).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" data-testid="tabs-donor">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="donations" data-testid="tab-donations">
            Donations <Badge variant="secondary" className="ml-2">{donations.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="events" data-testid="tab-events">
            Events <Badge variant="secondary" className="ml-2">{eventsAttended}</Badge>
          </TabsTrigger>
          <TabsTrigger value="livestreams" data-testid="tab-livestreams">
            Livestreams <Badge variant="secondary" className="ml-2">{interactions?.livestreamDonations?.length || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="activities" data-testid="tab-activities">
            Activities <Badge variant="secondary" className="ml-2">{interactions?.activityRegistrations?.length || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="tags" data-testid="tab-tags">
            Tags <Badge variant="secondary" className="ml-2">{donorTags.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Contributions</span>
                  <span className="font-semibold">{formatCurrency(parseFloat(donor.totalDonated) + livestreamDonationTotal + eventSpending)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Regular Donations</span>
                  <span className="font-semibold">{formatCurrency(parseFloat(donor.totalDonated))}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Livestream Donations</span>
                  <span className="font-semibold">{formatCurrency(livestreamDonationTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Event Spending</span>
                  <span className="font-semibold">{formatCurrency(eventSpending)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Donations Made</span>
                  </div>
                  <span className="font-semibold">{donations.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Events Attended</span>
                  </div>
                  <span className="font-semibold">{eventsAttended}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Livestream Donations</span>
                  </div>
                  <span className="font-semibold">{interactions?.livestreamDonations?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Activities Enrolled</span>
                  </div>
                  <span className="font-semibold">{interactions?.activityRegistrations?.length || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Donations Tab */}
        <TabsContent value="donations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Donation History</CardTitle>
            </CardHeader>
            <CardContent>
              {interactionsLoading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded"></div>
                  ))}
                </div>
              ) : sortedDonations.length > 0 ? (
                <div className="space-y-3">
                  {sortedDonations.map((donation) => (
                    <div
                      key={donation.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover-elevate cursor-pointer"
                      onClick={() => openEditDialog(donation)}
                      data-testid={`donation-${donation.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-semibold">
                          {formatCurrency(parseFloat(donation.amount))}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(donation.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {donation.category && (
                            <Badge variant="outline" className="text-xs">
                              {donation.category}
                            </Badge>
                          )}
                          {donation.recurring && (
                            <Badge variant="outline" className="text-xs">
                              Recurring ({donation.frequency})
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={donation.status === "completed" ? "default" : "secondary"}
                      >
                        {donation.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No donation history available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Events Attended</CardTitle>
            </CardHeader>
            <CardContent>
              {interactionsLoading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded"></div>
                  ))}
                </div>
              ) : (interactions?.eventRegistrations || []).length > 0 ? (
                <div className="space-y-3">
                  {(interactions?.eventRegistrations || []).map((registration) => (
                    <div
                      key={registration.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
                      data-testid={`event-registration-${registration.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{registration.event?.title || 'Unknown Event'}</p>
                        <p className="text-sm text-muted-foreground">
                          {registration.event?.startDate 
                            ? new Date(registration.event.startDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })
                            : 'Date TBA'}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {registration.ticketCount} ticket{registration.ticketCount !== 1 ? 's' : ''}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {formatCurrency(parseFloat(registration.totalPaid))}
                          </Badge>
                          {registration.checkedIn && (
                            <Badge variant="default" className="text-xs">
                              Checked In
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge variant={registration.status === "confirmed" ? "default" : "secondary"}>
                        {registration.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No event attendance recorded
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Livestreams Tab */}
        <TabsContent value="livestreams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Livestream Donations</CardTitle>
            </CardHeader>
            <CardContent>
              {interactionsLoading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded"></div>
                  ))}
                </div>
              ) : (interactions?.livestreamDonations || []).length > 0 ? (
                <div className="space-y-3">
                  {(interactions?.livestreamDonations || []).map((donation) => (
                    <div
                      key={donation.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
                      data-testid={`livestream-donation-${donation.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-semibold">
                          {formatCurrency(parseFloat(donation.amount))}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {donation.livestream?.title || 'Unknown Livestream'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(donation.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        {donation.message && (
                          <p className="text-sm text-muted-foreground italic mt-1">
                            "{donation.message}"
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {donation.category && (
                            <Badge variant="outline" className="text-xs">
                              {donation.category}
                            </Badge>
                          )}
                          {donation.highlighted && (
                            <Badge variant="default" className="text-xs">
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No livestream donations recorded
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activities Enrolled</CardTitle>
            </CardHeader>
            <CardContent>
              {interactionsLoading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded"></div>
                  ))}
                </div>
              ) : (interactions?.activityRegistrations || []).length > 0 ? (
                <div className="space-y-3">
                  {(interactions?.activityRegistrations || []).map((registration) => (
                    <div
                      key={registration.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
                      data-testid={`activity-registration-${registration.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{registration.activity?.title || 'Unknown Activity'}</p>
                        <p className="text-sm text-muted-foreground">
                          Registered: {new Date(registration.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        {registration.activity?.schedule && (
                          <p className="text-sm text-muted-foreground">
                            {registration.activity.schedule}
                          </p>
                        )}
                      </div>
                      <Badge variant={registration.status === "confirmed" ? "default" : "secondary"}>
                        {registration.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No activity enrollments recorded
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tags Tab */}
        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Donor Tags</CardTitle>
                <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-tag">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Tag
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{isCreatingTag ? "Create New Tag" : "Add Tag to Donor"}</DialogTitle>
                      <DialogDescription>
                        {isCreatingTag ? "Create a new tag and assign it to this donor" : "Select a tag to assign to this donor"}
                      </DialogDescription>
                    </DialogHeader>
                    
                    {isCreatingTag ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="tag-name">Tag Name</Label>
                          <Input
                            id="tag-name"
                            placeholder="e.g., Major Donor, Monthly Supporter"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            data-testid="input-tag-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tag-color">Tag Color</Label>
                          <div className="flex gap-2">
                            <Input
                              id="tag-color"
                              type="color"
                              value={newTagColor}
                              onChange={(e) => setNewTagColor(e.target.value)}
                              className="w-20 h-10"
                              data-testid="input-tag-color"
                            />
                            <Input
                              type="text"
                              value={newTagColor}
                              onChange={(e) => setNewTagColor(e.target.value)}
                              placeholder="#3B82F6"
                              data-testid="input-tag-color-text"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              if (newTagName.trim() && donorId) {
                                createTagMutation.mutate({
                                  name: newTagName.trim(),
                                  color: newTagColor,
                                  donorId: donorId,
                                });
                              }
                            }}
                            disabled={!newTagName.trim() || !donorId || createTagMutation.isPending}
                            data-testid="button-create-tag"
                          >
                            {createTagMutation.isPending ? "Creating & Assigning..." : "Create & Assign"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsCreatingTag(false);
                              setNewTagName("");
                              setNewTagColor("#3B82F6");
                            }}
                            disabled={createTagMutation.isPending}
                            data-testid="button-cancel-create"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {unassignedTags.length > 0 ? (
                            unassignedTags.map((tag) => (
                              <button
                                key={tag.id}
                                onClick={() => {
                                  assignTagMutation.mutate(tag.id);
                                  setIsTagDialogOpen(false);
                                }}
                                className="w-full p-3 text-left border rounded-lg hover-elevate"
                                data-testid={`button-assign-tag-${tag.name}`}
                              >
                                <Badge
                                  variant="outline"
                                  style={{ 
                                    backgroundColor: `${tag.color}20`,
                                    borderColor: tag.color,
                                    color: tag.color
                                  }}
                                >
                                  {tag.name}
                                </Badge>
                              </button>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              {availableTags.length === 0 
                                ? "No tags available. Create your first tag below." 
                                : "All available tags have been assigned"}
                            </p>
                          )}
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsCreatingTag(true)}
                            data-testid="button-show-create-tag"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create New Tag
                          </Button>
                        </DialogFooter>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {donorTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {donorTags.map((dt) => (
                    <div
                      key={dt.id}
                      className="flex items-center gap-2 p-2 border rounded-lg"
                      data-testid={`donor-tag-${dt.tag.name}`}
                    >
                      <Badge
                        variant="outline"
                        style={{ 
                          backgroundColor: `${dt.tag.color}20`,
                          borderColor: dt.tag.color,
                          color: dt.tag.color
                        }}
                      >
                        {dt.tag.name}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => removeTagMutation.mutate(dt.tagId)}
                        data-testid={`button-remove-tag-${dt.tag.name}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No tags assigned to this donor
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                      {selectedDonation.donor?.firstName?.[0] || donor?.firstName?.[0] || "?"}
                      {selectedDonation.donor?.lastName?.[0] || donor?.lastName?.[0] || ""}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {selectedDonation.donor 
                        ? `${selectedDonation.donor.firstName} ${selectedDonation.donor.lastName}`
                        : donor
                        ? `${donor.firstName} ${donor.lastName}`
                        : "Unknown Donor"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDonation.donor?.email || donor?.email || "No email"}
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
                      <span className="text-muted-foreground">{selectedDonation.currency || "USD"}</span>
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
                  disabled={sendThankYouMutation.isPending || !(selectedDonation.donor?.email || donor?.email)}
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
                
                {!(selectedDonation.donor?.email || donor?.email) && (
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
