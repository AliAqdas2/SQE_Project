import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Upload, ArrowLeft, Plus, Check, ChevronsUpDown } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getDonationCategories } from "@shared/constants";
import { cn } from "@/lib/utils";

interface Donor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  tier: string;
}

interface Campaign {
  id: string;
  title: string;
  status: string;
}

interface Event {
  id: string;
  title: string;
  eventType: string;
}

interface Organization {
  id: string;
  name: string;
  religion?: string;
  country?: string;
}

interface Donation {
  id: string;
  orgId: string;
  donorId?: string;
  donationType: string;
  campaignId?: string;
  eventId?: string;
  amount: string;
  currency: string;
  category?: string;
  notes?: string;
  receiptUrl?: string;
  thankYouSent?: boolean;
  thankYouSentAt?: Date;
  giftAidOptIn?: boolean;
  donorAddress?: string;
  donorTown?: string;
  donorState?: string;
  donorPostcode?: string;
}

const donationFormSchema = z.object({
  donorId: z.string().min(1, "Please select a donor"),
  donationType: z.enum(["campaign", "event", "in-kind", "cash", "bank"]),
  campaignId: z.string().optional(),
  eventId: z.string().optional(),
  amount: z.string().min(1, "Amount is required").regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"),
  currency: z.string().default("USD"),
  category: z.string().optional(),
  notes: z.string().optional(),
  sendThankYou: z.boolean().default(false),
  giftAidOptIn: z.boolean().default(false),
  donorAddress: z.string().optional(),
  donorTown: z.string().optional(),
  donorState: z.string().optional(),
  donorPostcode: z.string().optional(),
}).refine(
  (data) => {
    if (data.donationType === "campaign") {
      return !!data.campaignId;
    }
    return true;
  },
  {
    message: "Please select a campaign for campaign donations",
    path: ["campaignId"],
  }
).refine(
  (data) => {
    if (data.donationType === "event") {
      return !!data.eventId;
    }
    return true;
  },
  {
    message: "Please select an event for event donations",
    path: ["eventId"],
  }
).refine(
  (data) => {
    if (data.giftAidOptIn) {
      return !!data.donorAddress && !!data.donorTown && !!data.donorState && !!data.donorPostcode;
    }
    return true;
  },
  {
    message: "Address details are required when opting into Gift Aid",
    path: ["giftAidOptIn"],
  }
);

const newDonorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  tier: z.enum(["bronze", "silver", "gold", "platinum"]).default("bronze"),
});

type DonationFormValues = z.infer<typeof donationFormSchema>;
type NewDonorFormValues = z.infer<typeof newDonorSchema>;

export default function DonationFormPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/dashboard/donations/:id/edit");
  const donationId = params?.id;
  const isEditing = !!donationId;
  
  const { toast } = useToast();
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string>("");
  const [newDonorDialogOpen, setNewDonorDialogOpen] = useState(false);
  const [donorSearchQuery, setDonorSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [donorComboboxOpen, setDonorComboboxOpen] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(donorSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [donorSearchQuery]);

  // Get orgId from session
  const { data: session } = useQuery<{ user: { orgId: string } }>({
    queryKey: ["/api/auth/session"],
    enabled: true,
  });

  const orgId = session?.user?.orgId;

  // Fetch existing donation if editing
  const { data: existingDonation, isLoading: donationLoading } = useQuery<Donation>({
    queryKey: [`/api/donations/${donationId}`],
    enabled: !!donationId && !!orgId,
  });

  // Fetch donors for selection (base list for editing)
  const { data: donors, isLoading: donorsLoading } = useQuery<Donor[]>({
    queryKey: [`/api/donors?orgId=${orgId}`],
    enabled: !!orgId,
  });

  // Search donors with debounced query
  const { data: searchResults = [], isLoading: searchLoading } = useQuery<Donor[]>({
    queryKey: [`/api/donors/search?q=${debouncedSearchQuery}&orgId=${orgId}`],
    enabled: debouncedSearchQuery.length >= 2 && donorComboboxOpen && !!orgId,
  });

  // Fetch campaigns for selection
  const { data: campaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: [`/api/campaigns?orgId=${orgId}`],
    enabled: !!orgId,
  });

  // Fetch events for selection
  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: [`/api/events?orgId=${orgId}`],
    enabled: !!orgId,
  });

  // Fetch organization for religion-based categories
  const { data: organization } = useQuery<Organization>({
    queryKey: [`/api/org/${orgId}`],
    enabled: !!orgId,
  });

  // Get donation categories based on organization's religion
  const donationCategories = getDonationCategories(organization?.religion);

  const form = useForm<DonationFormValues>({
    resolver: zodResolver(donationFormSchema),
    defaultValues: {
      donorId: "",
      donationType: "campaign",
      campaignId: "",
      eventId: "",
      category: "",
      amount: "",
      currency: "USD",
      notes: "",
      sendThankYou: false,
      giftAidOptIn: false,
      donorAddress: "",
      donorTown: "",
      donorState: "",
      donorPostcode: "",
    },
  });

  const newDonorForm = useForm<NewDonorFormValues>({
    resolver: zodResolver(newDonorSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      tier: "bronze",
    },
  });

  // Load existing donation data when editing
  useEffect(() => {
    if (existingDonation && !donationLoading) {
      form.reset({
        donorId: existingDonation.donorId || "",
        donationType: (existingDonation.donationType as "campaign" | "event" | "in-kind" | "cash" | "bank") || "campaign",
        campaignId: existingDonation.campaignId || "",
        eventId: existingDonation.eventId || "",
        category: existingDonation.category || "",
        amount: existingDonation.amount || "",
        currency: existingDonation.currency || "USD",
        notes: existingDonation.notes || "",
        // Allow resending thank you email if it wasn't sent yet
        sendThankYou: !existingDonation.thankYouSent,
        giftAidOptIn: existingDonation.giftAidOptIn || false,
        donorAddress: existingDonation.donorAddress || "",
        donorTown: existingDonation.donorCity || "", // Map from database donorCity to form donorTown
        donorState: existingDonation.donorCountry || "", // Map from database donorCountry to form donorState
        donorPostcode: existingDonation.donorPostcode || "",
      });
      if (existingDonation.receiptUrl) {
        setReceiptUrl(existingDonation.receiptUrl);
      }
      // Sync selected donor state for combobox display
      if (existingDonation.donorId && donors) {
        const donor = donors.find(d => d.id === existingDonation.donorId);
        if (donor) {
          setSelectedDonor(donor);
        }
      }
    }
  }, [existingDonation, donationLoading, form, donors]);

  // Watch donation type to show/hide campaign/event selectors
  const donationType = form.watch("donationType");

  const createDonorMutation = useMutation({
    mutationFn: async (data: NewDonorFormValues) => {
      if (!orgId) {
        throw new Error("Organization not loaded");
      }
      const response = await apiRequest("POST", "/api/donors", {
        ...data,
        orgId,
      });
      return response.json();
    },
    onSuccess: (newDonor) => {
      // Invalidate donor list and search cache
      queryClient.invalidateQueries({ queryKey: [`/api/donors?orgId=${orgId}`] });
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          typeof query.queryKey[0] === 'string' && 
          query.queryKey[0].startsWith('/api/donors/search')
      });
      
      // Optimistically add the new donor to the query cache so it appears immediately
      queryClient.setQueryData<Donor[]>(`/api/donors?orgId=${orgId}`, (oldData = []) => {
        // Check if donor already exists to avoid duplicates
        if (oldData.some(d => d.id === newDonor.id)) {
          return oldData;
        }
        return [...oldData, newDonor];
      });
      
      toast({
        title: "Success",
        description: "Donor created successfully",
      });
      // Select the newly created donor and trigger validation to clear any errors
      form.setValue("donorId", newDonor.id, { shouldValidate: true });
      setSelectedDonor(newDonor);
      setNewDonorDialogOpen(false);
      newDonorForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create donor",
        variant: "destructive",
      });
    },
  });

  const createDonationMutation = useMutation({
    mutationFn: async (data: DonationFormValues & { receiptUrl?: string }) => {
      if (!orgId) {
        throw new Error("Organization not loaded");
      }
      // Prepare data with proper orgId and map field names for backend
      const payload = {
        ...data,
        orgId,
        // Keep amount as string for decimal precision
        // Only include campaignId if donation type is campaign
        campaignId: data.donationType === "campaign" ? data.campaignId : undefined,
        // Only include eventId if donation type is event
        eventId: data.donationType === "event" ? data.eventId : undefined,
        // Map frontend field names to database field names
        donorTown: data.donorTown, // Frontend uses donorTown
        donorState: data.donorState, // Frontend uses donorState
        // Backend will map these to donorCity and donorCountry
      };
      
      if (isEditing) {
        return await apiRequest("PATCH", `/api/org/${orgId}/donations/${donationId}`, payload);
      } else {
        return await apiRequest("POST", `/api/org/${orgId}/donations`, payload);
      }
    },
    onSuccess: () => {
      // Invalidate all donation queries for this organization (with or without query params)
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === 'string' &&
          query.queryKey[0].startsWith(`/api/org/${orgId}/donations`)
      });
      toast({
        title: "Success",
        description: isEditing ? "Donation updated successfully" : "Donation added successfully",
      });
      navigate("/dashboard/donations");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || (isEditing ? "Failed to update donation" : "Failed to add donation"),
        variant: "destructive",
      });
    },
  });

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!orgId) {
      toast({
        title: "Error",
        description: "Organization not loaded. Please wait.",
        variant: "destructive",
      });
      return;
    }

    setReceiptFile(file);
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
      setReceiptUrl(url);
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

  const onSubmit = (data: DonationFormValues) => {
    createDonationMutation.mutate({
      ...data,
      receiptUrl: receiptUrl || undefined,
    });
  };

  return (
    <div className="p-8 space-y-6">
      <Breadcrumbs 
        items={[
          { label: "Donations", href: "/dashboard/donations" },
          { label: isEditing ? "Edit Donation" : "Add Donation" }
        ]} 
      />
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/dashboard/donations")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{isEditing ? "Edit Donation" : "Add Manual Donation"}</h1>
          <p className="text-muted-foreground mt-1">
            {isEditing ? "Update donation details" : "Record donations received outside of the platform"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Donation Details</CardTitle>
          <CardDescription>
            Enter the details of the donation to add it to your records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="donorId"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Donor</FormLabel>
                      <Dialog open={newDonorDialogOpen} onOpenChange={setNewDonorDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!orgId}
                            data-testid="button-create-donor"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create New Donor
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Donor</DialogTitle>
                            <DialogDescription>
                              Add a new donor to your database. They will be automatically selected.
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...newDonorForm}>
                            <form onSubmit={newDonorForm.handleSubmit((data) => createDonorMutation.mutate(data))} className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={newDonorForm.control}
                                  name="firstName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>First Name</FormLabel>
                                      <FormControl>
                                        <Input {...field} data-testid="input-new-donor-firstName" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={newDonorForm.control}
                                  name="lastName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Last Name</FormLabel>
                                      <FormControl>
                                        <Input {...field} data-testid="input-new-donor-lastName" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <FormField
                                control={newDonorForm.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                      <Input type="email" {...field} data-testid="input-new-donor-email" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={newDonorForm.control}
                                name="phone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Phone (optional)</FormLabel>
                                    <FormControl>
                                      <Input {...field} data-testid="input-new-donor-phone" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={newDonorForm.control}
                                name="tier"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Tier</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-new-donor-tier">
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="bronze">Bronze</SelectItem>
                                        <SelectItem value="silver">Silver</SelectItem>
                                        <SelectItem value="gold">Gold</SelectItem>
                                        <SelectItem value="platinum">Platinum</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <DialogFooter>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setNewDonorDialogOpen(false)}
                                  data-testid="button-cancel-new-donor"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="submit"
                                  disabled={!orgId || createDonorMutation.isPending}
                                  data-testid="button-submit-new-donor"
                                >
                                  {!orgId ? "Loading..." : createDonorMutation.isPending ? "Creating..." : "Create Donor"}
                                </Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <Popover open={donorComboboxOpen} onOpenChange={setDonorComboboxOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={donorComboboxOpen}
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="combobox-donor"
                          >
                            {field.value
                              ? (() => {
                                  // Look in both base donor list and search results
                                  const allDonors = [...(donors || []), ...(searchResults || [])];
                                  const selectedDonor = allDonors.find(d => d.id === field.value);
                                  return selectedDonor ? `${selectedDonor.firstName} ${selectedDonor.lastName} (${selectedDonor.email})` : "Select a donor";
                                })()
                              : "Search for a donor..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Search donors by name or email..."
                            value={donorSearchQuery}
                            onValueChange={setDonorSearchQuery}
                            data-testid="input-donor-search"
                          />
                          <CommandList>
                            <CommandEmpty>
                              {searchLoading ? "Searching..." : debouncedSearchQuery.length < 2 ? "Type at least 2 characters to search" : "No donors found"}
                            </CommandEmpty>
                            <CommandGroup>
                              {(debouncedSearchQuery.length >= 2 ? searchResults : donors || []).map((donor) => (
                                <CommandItem
                                  key={donor.id}
                                  value={donor.id}
                                  onSelect={() => {
                                    form.setValue("donorId", donor.id, { shouldValidate: true });
                                    setDonorComboboxOpen(false);
                                  }}
                                  data-testid={`donor-option-${donor.id}`}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === donor.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {donor.firstName} {donor.lastName} ({donor.email})
                                </CommandItem>
                              ))}
                            </CommandGroup>
                            <CommandGroup>
                              <CommandItem
                                onSelect={() => {
                                  setDonorComboboxOpen(false);
                                  setNewDonorDialogOpen(true);
                                }}
                                className="text-primary"
                                data-testid="button-create-donor-inline"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Create new donor
                              </CommandItem>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Select the donor who made this donation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="donationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Donation Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-donation-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="campaign">Campaign Donation</SelectItem>
                        <SelectItem value="event">Event Donation</SelectItem>
                        <SelectItem value="in-kind">In-Kind Donation</SelectItem>
                        <SelectItem value="cash">Cash Donation</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How was this donation received?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {donationType === "campaign" && (
                <FormField
                  control={form.control}
                  name="campaignId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={campaignsLoading}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-campaign">
                            <SelectValue placeholder="Select a campaign" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {campaigns?.filter(c => c.status === 'active').map((campaign) => (
                            <SelectItem key={campaign.id} value={campaign.id}>
                              {campaign.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Which campaign is this donation for?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {donationType === "event" && (
                <FormField
                  control={form.control}
                  name="eventId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={eventsLoading}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-event">
                            <SelectValue placeholder="Select an event" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {events?.map((event) => (
                            <SelectItem key={event.id} value={event.id}>
                              {event.title} ({event.eventType})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Which event is this donation for?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="0.00"
                          {...field}
                          data-testid="input-amount"
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the donation amount
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-currency">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="AED">AED (د.إ)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Donation Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {donationCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Categorize this donation based on its purpose
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Receipt</FormLabel>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    onChange={handleReceiptUpload}
                    disabled={!orgId || uploadingReceipt}
                    className="flex-1"
                    data-testid="input-receipt-file"
                  />
                  {uploadingReceipt && (
                    <span className="text-sm text-muted-foreground">Uploading...</span>
                  )}
                  {receiptUrl && !uploadingReceipt && (
                    <a
                      href={receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-sm hover:underline"
                      data-testid="link-uploaded-receipt"
                    >
                      View Receipt
                    </a>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload a receipt or proof of donation (optional)
                </p>
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes about this donation..."
                        className="resize-none"
                        rows={4}
                        {...field}
                        data-testid="textarea-notes"
                      />
                    </FormControl>
                    <FormDescription>
                      Optional notes for internal reference
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sendThankYou"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-send-thank-you"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Send Thank You Email
                      </FormLabel>
                      <FormDescription>
                        Automatically send a thank you email to the donor
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="giftAidOptIn"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-gift-aid"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Gift Aid / Tax Relief
                      </FormLabel>
                      <FormDescription>
                        Donor consents to Gift Aid/tax relief (address required)
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch("giftAidOptIn") && (
                <div className="grid gap-4 md:grid-cols-2 p-4 border rounded-md">
                  <FormField
                    control={form.control}
                    name="donorAddress"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123 Main Street"
                            {...field}
                            data-testid="input-donor-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="donorTown"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Town</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Town"
                            {...field}
                            data-testid="input-donor-town"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="donorState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State / City</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="State or City"
                            {...field}
                            data-testid="input-donor-state"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="donorPostcode"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Postcode / Zip Code</FormLabel>
                          <FormControl>
                          <Input
                            placeholder="Postcode or Zip Code"
                            {...field}
                            data-testid="input-donor-postcode"
                          />
                          </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="flex gap-4 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard/donations")}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!orgId || createDonationMutation.isPending}
                  data-testid="button-submit"
                >
                  {!orgId ? "Loading..." : createDonationMutation.isPending ? "Adding..." : "Add Donation"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
