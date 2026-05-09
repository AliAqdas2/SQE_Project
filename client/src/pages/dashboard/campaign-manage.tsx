import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";
import { formatCurrency as formatCurrencyByCode } from "@/lib/format-utils";
import { ImageUpload } from "@/components/image-upload";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Calendar,
  Coins,
  Receipt,
  MessageSquare,
  ListFilter,
  Code2,
  Compass,
  Gauge,
  CheckCircle,
  RefreshCw,
  MoreVertical,
  Edit,
  Mail,
  FileText,
  Check,
  X,
  Users,
  Crown,
  ArrowRight,
  Paperclip
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from "date-fns";
import { CampaignEmbedCode } from "@/components/campaign-embed-code";
import { ImpactReport } from "@/components/impact-report";

type Campaign = {
  id: string;
  title: string;
  goalAmount: string;
  currentAmount: string;
  description: string;
  category: string;
  country: string;
  status: string;
};

type CampaignUpdate = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  showOnPublicPage: boolean;
  createdAt: string;
};

type CampaignExpense = {
  id: string;
  description: string;
  amount: string; // Total amount
  unitPrice?: string | null; // Price per unit
  quantity?: number | null; // Quantity
  category: string;
  date: string;
  receiptUrl?: string;
};


type Donation = {
  id: string;
  amount: string;
  donorName: string;
  donorEmail: string;
  createdAt: string;
  status: string;
  message?: string;
  category?: string;
  coverFees?: boolean;
  feeAmount?: string;
  currency?: string;
  donorId?: string | null;
  notes?: string | null;
  giftAidOptIn?: boolean;
  taxReliefAmount?: string | null;
  thankYouSent: boolean;
  thankYouSentAt?: string | null;
  receiptUrl?: string | null;
  donationType?: string;
  orgId: string;
  campaignId?: string | null;
};

type CampaignStrategy = {
  id: string;
  campaignId: string;
  orgId: string;
  model: string;
  summary?: string;
  insights?: string;
  generatedAt: string;
  content: {
    donorOutreach?: string[];
    socialMedia?: string[];
    messaging?: string[];
    events?: string[];
    onlineCommunities?: string[];
  };
};

interface SubscriptionInfo {
  subscription: { id: string; planId: string; status: string };
  plan: { id: string; tierCode: string; name: string };
}

export default function CampaignManage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { formatCurrency, currencySymbol } = useOrganizationLocale();

  // Get current user session
  const { data: session } = useQuery<{ user: { orgId: string } }>({
    queryKey: ["/api/auth/session"],
  });

  // Check subscription status
  const { data: subscriptionInfo, isLoading: subscriptionLoading } = useQuery<SubscriptionInfo>({
    queryKey: ["/api/org", session?.user?.orgId, "subscription"],
    enabled: !!session?.user?.orgId,
  });

  const isFreePlan = subscriptionInfo?.plan?.tierCode?.toLowerCase() === "free";

  // Fetch campaign data
  const { data: campaign, isLoading: campaignLoading } = useQuery<Campaign>({
    queryKey: ["/api/campaigns", id],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch campaign");
      return res.json();
    },
    enabled: !!id,
  });

  // Fetch organization data for PDF branding and country check
  const { data: organization } = useQuery<{ country?: string }>({
    queryKey: ["/api/organization"],
    enabled: !!campaign,
  });
  
  const isUK = organization?.country === "GB";

  // Campaign Updates
  const { data: updatesData = [] } = useQuery<CampaignUpdate[]>({
    queryKey: ["/api/campaigns", id, "updates"],
    enabled: !!id,
  });

  // Sort updates by date (newest first) for timeline display
  const updates = [...updatesData].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const [newUpdate, setNewUpdate] = useState({ title: "", content: "", imageUrl: "", showOnPublicPage: false });
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [editUpdate, setEditUpdate] = useState<CampaignUpdate | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const createUpdateMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; imageUrl?: string; showOnPublicPage: boolean }) =>
      apiRequest("POST", `/api/campaigns/${id}/updates`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", id, "updates"] });
      setUpdateDialogOpen(false);
      setNewUpdate({ title: "", content: "", imageUrl: "", showOnPublicPage: false });
      toast({ title: "Update posted successfully" });
    },
  });

  const updateUpdateMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; content: string; imageUrl?: string; showOnPublicPage: boolean }) =>
      apiRequest("PATCH", `/api/campaigns/${id}/updates/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", id, "updates"] });
      setEditDialogOpen(false);
      setEditUpdate(null);
      toast({ title: "Update edited successfully" });
    },
  });

  const deleteUpdateMutation = useMutation({
    mutationFn: async (updateId: string) =>
      apiRequest("DELETE", `/api/campaigns/${id}/updates/${updateId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", id, "updates"] });
      toast({ title: "Update deleted" });
    },
  });

  // Campaign Expenses
  const { data: expenses = [] } = useQuery<CampaignExpense[]>({
    queryKey: ["/api/campaigns", id, "expenses"],
    enabled: !!id,
  });

  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    quantity: "1",
    category: "operations",
    date: new Date().toISOString().split('T')[0],
  });
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);

  const createExpenseMutation = useMutation({
    mutationFn: async (data: { description: string; amount: string; quantity: string; category: string; date: string }) => {
      // Convert date string (YYYY-MM-DD) to ISO timestamp preserving local date
      // Appending T00:00:00 ensures the date is interpreted in local timezone
      const dateWithTime = new Date(data.date + "T00:00:00").toISOString();
      
      return apiRequest("POST", `/api/campaigns/${id}/expenses`, {
        description: data.description,
        unitPrice: data.amount, // Send unit price
        quantity: data.quantity, // Send quantity
        category: data.category,
        date: dateWithTime,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", id, "expenses"] });
      setExpenseDialogOpen(false);
      setNewExpense({ description: "", amount: "", quantity: "1", category: "operations", date: new Date().toISOString().split('T')[0] });
      toast({ title: "Expense added successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add expense",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) =>
      apiRequest("DELETE", `/api/campaigns/${id}/expenses/${expenseId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", id, "expenses"] });
      toast({ title: "Expense deleted" });
    },
  });

  // AI Campaign Strategy
  const { data: strategy, isLoading: strategyLoading } = useQuery<CampaignStrategy>({
    queryKey: ["/api/campaigns", id, "strategy"],
    enabled: !!id,
  });

  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);

  const generateStrategyMutation = useMutation({
    mutationFn: async () =>
      apiRequest("POST", `/api/campaigns/${id}/strategy`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", id, "strategy"] });
      toast({ title: "Strategy generated successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to generate strategy",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Donations (Transaction Log)
  const { data: donations = [] } = useQuery<Donation[]>({
    queryKey: ["/api/donations", id],
    queryFn: async () => {
      const res = await fetch(`/api/donations?campaignId=${id}`);
      if (!res.ok) throw new Error("Failed to fetch donations");
      return res.json();
    },
    enabled: !!id,
  });

  // Edit Donation State
  const [editDonationDialogOpen, setEditDonationDialogOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [editDonationData, setEditDonationData] = useState({
    amount: "",
    donorName: "",
    donorEmail: "",
    message: "",
    category: "general",
    receiptUrl: "",
    notes: "",
  });

  // Resend Thank You State
  const [resendDialogOpen, setResendDialogOpen] = useState(false);
  const [resendDonation, setResendDonation] = useState<Donation | null>(null);
  const [customMessage, setCustomMessage] = useState("");

  // Edit Donation Mutation
  const editDonationMutation = useMutation({
    mutationFn: async ({ donationId, updates }: { donationId: string; updates: any }) =>
      apiRequest("PATCH", `/api/donations/${donationId}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/donations", id] });
      setEditDonationDialogOpen(false);
      setSelectedDonation(null);
      toast({ title: "Donation updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update donation",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Resend Thank You Mutation
  const resendThankYouMutation = useMutation({
    mutationFn: async ({ donationId, message }: { donationId: string; message: string }) =>
      apiRequest("POST", `/api/donations/${donationId}/resend-thank-you`, { customMessage: message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/donations", id] });
      setResendDialogOpen(false);
      setResendDonation(null);
      setCustomMessage("");
      toast({ title: "Thank you email sent successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send email",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Toggle campaign status
  const toggleStatusMutation = useMutation({
    mutationFn: async (newStatus: string) =>
      apiRequest("PATCH", `/api/campaigns/${id}/status`, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", id] });
      toast({ 
        title: campaign?.status === "active" ? "Campaign disabled" : "Campaign enabled",
        description: campaign?.status === "active" 
          ? "This campaign is now hidden from public view" 
          : "This campaign is now visible to the public"
      });
    },
  });

  // Calculate chart data for expense tracker
  const totalDonations = donations.reduce((sum, donation) => sum + parseFloat(donation.amount), 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const netBalance = totalDonations - totalExpenses;

  const chartData = [
    {
      name: "Funds",
      Donations: totalDonations,
      Expenses: totalExpenses,
      Balance: netBalance,
    },
  ];

  // Show upgrade prompt for free plan users
  if (!subscriptionLoading && isFreePlan) {
    return (
      <div className="p-4 md:p-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Upgrade to Manage Campaigns</h2>
              <p className="text-muted-foreground max-w-md">
                Campaign management is a premium feature. Upgrade your plan to manage 
                campaigns with analytics, updates, and donor tracking.
              </p>
            </div>
            <Button size="lg" onClick={() => setLocation("/dashboard/subscription")} data-testid="button-upgrade-manage-campaign">
              View Plans & Upgrade
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (campaignLoading) {
    return <div className="p-6">Loading campaign...</div>;
  }

  if (!campaign) {
    return <div className="p-6">Campaign not found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard/campaigns")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{campaign.title}</h1>
            <p className="text-muted-foreground">Campaign Management</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border rounded-lg px-4 py-2">
            <Label htmlFor="campaign-status" className="text-sm font-medium">
              {campaign.status === "active" ? "Active" : "Disabled"}
            </Label>
            <Switch
              id="campaign-status"
              checked={campaign.status === "active"}
              onCheckedChange={(checked) => {
                toggleStatusMutation.mutate(checked ? "active" : "disabled");
              }}
              disabled={toggleStatusMutation.isPending}
              data-testid="switch-campaign-status"
            />
          </div>
          <ImpactReport 
            campaignId={campaign.id} 
            currency={(campaign as any).currency || "USD"} 
            campaignName={campaign.title}
            organizationName={organization?.name || "Organization"}
            organizationLogo={organization?.logoUrl || undefined}
          />
          <Button
            variant="outline"
            onClick={() => setLocation(`/dashboard/campaigns/${campaign.id}/p2p`)}
            data-testid="button-p2p-manage"
          >
            <Users className="h-4 w-4 mr-2" />
            P2P Fundraising
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="updates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="updates" data-testid="tab-updates">
            <Calendar className="h-4 w-4 mr-2" />
            Updates
          </TabsTrigger>
          <TabsTrigger value="expenses" data-testid="tab-expenses">
            <Receipt className="h-4 w-4 mr-2" />
            Expense Tracker
          </TabsTrigger>
          <TabsTrigger value="embed" data-testid="tab-embed">
            <Code2 className="h-4 w-4 mr-2" />
            Embed Widget
          </TabsTrigger>
          <TabsTrigger value="chat" data-testid="tab-chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            AI Campaign Manager
          </TabsTrigger>
          <TabsTrigger value="transactions" data-testid="tab-transactions">
            <ListFilter className="h-4 w-4 mr-2" />
            Transaction Log
          </TabsTrigger>
        </TabsList>

        {/* Campaign Updates Tab */}
        <TabsContent value="updates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Campaign Timeline</h2>
            <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-update">
                  <Plus className="mr-2 h-4 w-4" />
                  Post Update
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Post Campaign Update</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={newUpdate.title}
                      onChange={(e) => setNewUpdate({ ...newUpdate, title: e.target.value })}
                      placeholder="Update title"
                      data-testid="input-update-title"
                    />
                  </div>
                  <div>
                    <Label>Content</Label>
                    <Textarea
                      value={newUpdate.content}
                      onChange={(e) => setNewUpdate({ ...newUpdate, content: e.target.value })}
                      placeholder="Share your progress, stories, or news..."
                      rows={5}
                      data-testid="textarea-update-content"
                    />
                  </div>
                  <div>
                    <Label>Image (optional)</Label>
                    <ImageUpload
                      value={newUpdate.imageUrl}
                      onChange={(url) => setNewUpdate({ ...newUpdate, imageUrl: url })}
                      label="Upload Image"
                      endpoint="/api/campaigns/upload-image"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-on-public"
                      checked={newUpdate.showOnPublicPage}
                      onCheckedChange={(checked) => setNewUpdate({ ...newUpdate, showOnPublicPage: checked })}
                      data-testid="switch-show-public"
                    />
                    <Label htmlFor="show-on-public" className="cursor-pointer">
                      Show on fundraiser public page
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => createUpdateMutation.mutate(newUpdate)}
                    disabled={!newUpdate.title || !newUpdate.content || createUpdateMutation.isPending}
                    data-testid="button-submit-update"
                  >
                    {createUpdateMutation.isPending ? "Posting..." : "Post Update"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Update Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Campaign Update</DialogTitle>
                </DialogHeader>
                {editUpdate && (
                  <div className="space-y-4">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={editUpdate.title}
                        onChange={(e) => setEditUpdate({ ...editUpdate, title: e.target.value })}
                        placeholder="Update title"
                        data-testid="input-edit-update-title"
                      />
                    </div>
                    <div>
                      <Label>Content</Label>
                      <Textarea
                        value={editUpdate.content}
                        onChange={(e) => setEditUpdate({ ...editUpdate, content: e.target.value })}
                        placeholder="Share your progress, stories, or news..."
                        rows={5}
                        data-testid="textarea-edit-update-content"
                      />
                    </div>
                    <div>
                      <Label>Image (optional)</Label>
                      <ImageUpload
                        value={editUpdate.imageUrl || ""}
                        onChange={(url) => setEditUpdate({ ...editUpdate, imageUrl: url })}
                        label="Upload Image"
                        endpoint="/api/campaigns/upload-image"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="edit-show-on-public"
                        checked={editUpdate.showOnPublicPage}
                        onCheckedChange={(checked) => setEditUpdate({ ...editUpdate, showOnPublicPage: checked })}
                        data-testid="switch-edit-show-public"
                      />
                      <Label htmlFor="edit-show-on-public" className="cursor-pointer">
                        Show on fundraiser public page
                      </Label>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => editUpdate && updateUpdateMutation.mutate(editUpdate)}
                    disabled={!editUpdate || !editUpdate.title || !editUpdate.content || updateUpdateMutation.isPending}
                    data-testid="button-submit-edit-update"
                  >
                    {updateUpdateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {updates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No updates posted yet. Share progress with your donors!
              </CardContent>
            </Card>
          ) : (
            <div className="relative pl-6 space-y-6">
              {/* Timeline line */}
              <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
              
              {updates.map((update, index) => (
                <div key={update.id} className="relative" data-testid={`timeline-update-${update.id}`}>
                  {/* Timeline dot */}
                  <div className="absolute -left-6 top-6 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                  
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2">
                            {update.title}
                            {update.showOnPublicPage && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <Check className="h-3 w-3 mr-1" />
                                Public
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(update.createdAt), "PPpp")}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditUpdate(update);
                              setEditDialogOpen(true);
                            }}
                            data-testid={`button-edit-update-${update.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteUpdateMutation.mutate(update.id)}
                            data-testid={`button-delete-update-${update.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {update.imageUrl && (
                        <div className="w-full overflow-hidden rounded-md border border-border bg-muted/30">
                        <img
                          src={update.imageUrl}
                          alt={update.title}
                            className="w-full h-auto max-h-96 object-contain mx-auto block"
                            style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                        />
                        </div>
                      )}
                      <p className="whitespace-pre-wrap text-muted-foreground">{update.content}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Expense Tracker Tab */}
        <TabsContent value="expenses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
              <CardDescription>Donations collected vs expenses incurred</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Donations" fill="hsl(var(--primary))" />
                  <Bar dataKey="Expenses" fill="hsl(var(--destructive))" />
                  <Bar dataKey="Balance" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Donations</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(totalDonations)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold text-destructive">
                    {formatCurrency(totalExpenses)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Net Balance</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(netBalance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Expense Records</h2>
            <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-expense">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Campaign Expense</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                      placeholder="What was this expense for?"
                      data-testid="input-expense-description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                  <div>
                      <Label>Unit Price ({currencySymbol})</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      placeholder="0.00"
                      data-testid="input-expense-amount"
                      />
                    </div>
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={newExpense.quantity}
                        onChange={(e) => setNewExpense({ ...newExpense, quantity: e.target.value })}
                        placeholder="1"
                        data-testid="input-expense-quantity"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Total ({currencySymbol})</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={(() => {
                        const quantity = parseFloat(newExpense.quantity) || 1;
                        const unitPrice = parseFloat(newExpense.amount) || 0;
                        return (quantity * unitPrice).toFixed(2);
                      })()}
                      readOnly
                      className="bg-muted"
                      data-testid="input-expense-total"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={newExpense.category}
                      onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                    >
                      <SelectTrigger data-testid="select-expense-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operations">Operations</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="events">Events</SelectItem>
                        <SelectItem value="supplies">Supplies</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                      data-testid="input-expense-date"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setExpenseDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => createExpenseMutation.mutate(newExpense)}
                    disabled={!newExpense.description || !newExpense.amount || !newExpense.quantity || createExpenseMutation.isPending}
                    data-testid="button-submit-expense"
                  >
                    {createExpenseMutation.isPending ? "Adding..." : "Add Expense"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {expenses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No expenses recorded yet
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {expenses.map((expense) => (
                    <div key={expense.id} className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{expense.description}</h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-secondary capitalize">
                            {expense.category}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(expense.date), "PPP")}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-lg font-semibold text-destructive">
                          {formatCurrency(parseFloat(expense.amount))}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteExpenseMutation.mutate(expense.id)}
                          data-testid={`button-delete-expense-${expense.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Embed Widget Tab */}
        <TabsContent value="embed">
          <CampaignEmbedCode 
            campaignId={id!} 
            campaignTitle={campaign?.title || "Campaign"} 
          />
        </TabsContent>

        {/* AI Campaign Manager Tab */}
        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>AI Campaign Strategist</CardTitle>
                  <CardDescription>
                    Get personalized advice on promoting your campaign and maximizing impact
                  </CardDescription>
                </div>
                {strategy && !strategyLoading && (
                  <AlertDialog open={isRegenerateDialogOpen} onOpenChange={setIsRegenerateDialogOpen}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsRegenerateDialogOpen(true)}
                      disabled={generateStrategyMutation.isPending}
                      data-testid="button-regenerate-strategy"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Regenerate Strategy?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will overwrite your current strategy with new AI-generated recommendations. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            generateStrategyMutation.mutate();
                            setIsRegenerateDialogOpen(false);
                          }}
                          data-testid="button-confirm-regenerate"
                        >
                          Regenerate Strategy
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!strategy && !strategyLoading && (
                <div className="text-center py-12">
                  <Compass className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Generate Your Marketing Strategy</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Get AI-powered recommendations on donor outreach, social media, messaging, events, and online communities tailored to your campaign.
                  </p>
                  <Button
                    onClick={() => generateStrategyMutation.mutate()}
                    disabled={generateStrategyMutation.isPending}
                    size="lg"
                    data-testid="button-generate-strategy"
                  >
                    {generateStrategyMutation.isPending ? (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                        Generating Strategy...
                      </>
                    ) : (
                      <>
                        <Compass className="h-5 w-5 mr-2" />
                        Generate Strategy
                      </>
                    )}
                  </Button>
                </div>
              )}

              {generateStrategyMutation.isPending && !strategy && (
                <div className="space-y-4">
                  <div className="text-center text-sm text-muted-foreground mb-4">
                    Analyzing your campaign and donor data...
                  </div>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              )}

              {strategy && !generateStrategyMutation.isPending && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground border-b pb-4">
                    <Badge variant="secondary">
                      {strategy.model}
                    </Badge>
                    <span>•</span>
                    <span>Generated {format(new Date(strategy.generatedAt), "PPp")}</span>
                    {strategy.summary && (
                      <>
                        <span>•</span>
                        <span className="text-xs">{strategy.summary}</span>
                      </>
                    )}
                  </div>

                  <Accordion type="single" collapsible className="w-full">
                    {strategy.content?.donorOutreach && (
                      <AccordionItem value="donor-outreach" data-testid="section-donor-outreach">
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            <span className="font-semibold">Donor Outreach Strategy</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2 border-l-2 border-muted pl-4 ml-2">
                            {strategy.content.donorOutreach.map((point: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                                <span className="text-sm">{point}</span>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {strategy.content?.socialMedia && (
                      <AccordionItem value="social-media" data-testid="section-social-media">
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            <span className="font-semibold">Social Media Strategy</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2 border-l-2 border-muted pl-4 ml-2">
                            {strategy.content.socialMedia.map((point: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                                <span className="text-sm">{point}</span>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {strategy.content?.messaging && (
                      <AccordionItem value="messaging" data-testid="section-messaging">
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            <span className="font-semibold">Messaging & Communication</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2 border-l-2 border-muted pl-4 ml-2">
                            {strategy.content.messaging.map((point: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                                <span className="text-sm">{point}</span>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {strategy.content?.events && (
                      <AccordionItem value="events" data-testid="section-events">
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            <span className="font-semibold">Event Ideas</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2 border-l-2 border-muted pl-4 ml-2">
                            {strategy.content.events.map((point: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                                <span className="text-sm">{point}</span>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {strategy.content?.onlineCommunities && (
                      <AccordionItem value="online-communities" data-testid="section-online-communities">
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            <span className="font-semibold">Online Communities to Target</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2 border-l-2 border-muted pl-4 ml-2">
                            {strategy.content.onlineCommunities.map((point: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                                <span className="text-sm">{point}</span>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transaction Log Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">All Donations</h2>
            <div className="text-sm text-muted-foreground">
              Total: {donations.length} transactions
            </div>
          </div>

          {donations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No donations recorded yet
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {donations.map((donation) => (
                    <div key={donation.id} className="p-4 flex items-center justify-between gap-4" data-testid={`donation-${donation.id}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium" data-testid={`text-donor-name-${donation.id}`}>{donation.donorName || "Anonymous"}</h3>
                          {donation.category && donation.category !== "general" && (
                            <Badge variant="secondary" className="text-xs capitalize" data-testid={`badge-category-${donation.id}`}>
                              {donation.category}
                            </Badge>
                          )}
                          {donation.coverFees && (
                            <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100" data-testid={`badge-fees-covered-${donation.id}`}>
                              Fees Covered
                            </Badge>
                          )}
                          {donation.thankYouSent ? (
                            <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100" data-testid={`badge-thank-you-sent-${donation.id}`}>
                              <Check className="h-3 w-3 mr-1" />
                              Thank You Sent
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" data-testid={`badge-thank-you-pending-${donation.id}`}>
                              <X className="h-3 w-3 mr-1" />
                              No Thank You
                            </Badge>
                          )}
                          {donation.receiptUrl && (
                            <Badge variant="secondary" className="text-xs" data-testid={`badge-receipt-${donation.id}`}>
                              <Paperclip className="h-3 w-3 mr-1" />
                              Receipt
                            </Badge>
                          )}
                          {isUK && donation.giftAidOptIn && donation.taxReliefAmount && (
                            <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100" data-testid={`badge-gift-aid-${donation.id}`}>
                              Gift Aid: +{formatCurrencyByCode(parseFloat(donation.taxReliefAmount), donation.currency || "USD")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground" data-testid={`text-donor-email-${donation.id}`}>{donation.donorEmail}</p>
                        {donation.message && (
                          <p className="text-sm italic mt-1" data-testid={`text-message-${donation.id}`}>&ldquo;{donation.message}&rdquo;</p>
                        )}
                        {donation.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic" data-testid={`text-notes-${donation.id}`}>
                            Internal Notes: {donation.notes}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground" data-testid={`text-date-${donation.id}`}>
                            {format(new Date(donation.createdAt), "PPpp")}
                          </p>
                          {donation.thankYouSent && donation.thankYouSentAt && (
                            <p className="text-xs text-muted-foreground" data-testid={`text-thank-you-date-${donation.id}`}>
                              • Thank you sent {format(new Date(donation.thankYouSentAt), "PPp")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className="text-lg font-semibold text-primary" data-testid={`text-amount-${donation.id}`}>
                            {formatCurrencyByCode(parseFloat(donation.amount), donation.currency || "USD")}
                          </p>
                          {donation.coverFees && donation.feeAmount && parseFloat(donation.feeAmount) > 0 && (
                            <p className="text-xs text-muted-foreground" data-testid={`text-fee-${donation.id}`}>
                              +{formatCurrencyByCode(parseFloat(donation.feeAmount), donation.currency || "USD")} fee
                            </p>
                          )}
                          <Badge variant="secondary" className="text-xs capitalize mt-1" data-testid={`badge-status-${donation.id}`}>
                            {donation.status}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-actions-${donation.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedDonation(donation);
                                setEditDonationData({
                                  amount: donation.amount,
                                  donorName: donation.donorName || "",
                                  donorEmail: donation.donorEmail || "",
                                  message: donation.message || "",
                                  category: donation.category || "general",
                                  receiptUrl: donation.receiptUrl || "",
                                  notes: donation.notes || "",
                                });
                                setEditDonationDialogOpen(true);
                              }}
                              data-testid={`menu-edit-${donation.id}`}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Donation
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setResendDonation(donation);
                                setCustomMessage("");
                                setResendDialogOpen(true);
                              }}
                              data-testid={`menu-resend-${donation.id}`}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              {donation.thankYouSent ? "Resend" : "Send"} Thank You
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Donation Dialog */}
      <Dialog open={editDonationDialogOpen} onOpenChange={setEditDonationDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Donation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-amount">Amount</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  value={editDonationData.amount}
                  onChange={(e) => setEditDonationData({ ...editDonationData, amount: e.target.value })}
                  data-testid="input-edit-amount"
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={editDonationData.category}
                  onValueChange={(value) => setEditDonationData({ ...editDonationData, category: value })}
                >
                  <SelectTrigger id="edit-category" data-testid="select-edit-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="tithe">Tithe</SelectItem>
                    <SelectItem value="sadaqa">Sadaqa</SelectItem>
                    <SelectItem value="zakat">Zakat</SelectItem>
                    <SelectItem value="offering">Offering</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-donor-name">Donor Name</Label>
                <Input
                  id="edit-donor-name"
                  value={editDonationData.donorName}
                  onChange={(e) => setEditDonationData({ ...editDonationData, donorName: e.target.value })}
                  data-testid="input-edit-donor-name"
                />
              </div>
              <div>
                <Label htmlFor="edit-donor-email">Donor Email</Label>
                <Input
                  id="edit-donor-email"
                  type="email"
                  value={editDonationData.donorEmail}
                  onChange={(e) => setEditDonationData({ ...editDonationData, donorEmail: e.target.value })}
                  data-testid="input-edit-donor-email"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-message">Donor Message</Label>
              <Textarea
                id="edit-message"
                value={editDonationData.message}
                onChange={(e) => setEditDonationData({ ...editDonationData, message: e.target.value })}
                placeholder="Optional message from donor"
                data-testid="textarea-edit-message"
              />
            </div>
            <div>
              <Label>Receipt Upload</Label>
              <ImageUpload
                value={editDonationData.receiptUrl || ""}
                onChange={(url: string) => setEditDonationData({ ...editDonationData, receiptUrl: url })}
                label="Upload Receipt"
              />
              {editDonationData.receiptUrl && (
                <p className="text-xs text-muted-foreground mt-2">
                  Receipt uploaded
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-notes">Internal Notes</Label>
              <Textarea
                id="edit-notes"
                value={editDonationData.notes}
                onChange={(e) => setEditDonationData({ ...editDonationData, notes: e.target.value })}
                placeholder="Add internal notes about this donation (not visible to donors)..."
                className="resize-none"
                rows={4}
                data-testid="textarea-edit-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDonationDialogOpen(false)}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedDonation) {
                  editDonationMutation.mutate({
                    donationId: selectedDonation.id,
                    updates: editDonationData,
                  });
                }
              }}
              disabled={editDonationMutation.isPending || !editDonationData.amount}
              data-testid="button-save-edit"
            >
              {editDonationMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resend Thank You Dialog */}
      <Dialog open={resendDialogOpen} onOpenChange={setResendDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{resendDonation?.thankYouSent ? "Resend" : "Send"} Thank You Email</DialogTitle>
            <CardDescription>
              Customize the thank you message for {resendDonation?.donorName || "this donor"}
            </CardDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Donation Details</Label>
              <div className="text-sm space-y-1 bg-muted p-3 rounded-md">
                <p><strong>Amount:</strong> {formatCurrency(parseFloat(resendDonation?.amount || "0"))}</p>
                <p><strong>Donor:</strong> {resendDonation?.donorName || "Anonymous"}</p>
                <p><strong>Email:</strong> {resendDonation?.donorEmail}</p>
                <p><strong>Date:</strong> {resendDonation?.createdAt && format(new Date(resendDonation.createdAt), "PPpp")}</p>
              </div>
            </div>
            <div>
              <Label htmlFor="custom-message">Custom Message (Optional)</Label>
              <Textarea
                id="custom-message"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Add a personalized message... (Leave empty to use default template)"
                rows={6}
                data-testid="textarea-custom-message"
              />
              <p className="text-xs text-muted-foreground mt-2">
                This message will be added to the thank you email. If left empty, the default template will be used.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResendDialogOpen(false)}
              data-testid="button-cancel-resend"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (resendDonation) {
                  resendThankYouMutation.mutate({
                    donationId: resendDonation.id,
                    message: customMessage,
                  });
                }
              }}
              disabled={resendThankYouMutation.isPending}
              data-testid="button-confirm-resend"
            >
              <Mail className="h-4 w-4 mr-2" />
              {resendThankYouMutation.isPending ? "Sending..." : `${resendDonation?.thankYouSent ? "Resend" : "Send"} Email`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
