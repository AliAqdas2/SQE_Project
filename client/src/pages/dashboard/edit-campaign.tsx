import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, ArrowLeft, Plus, X, Crown, ArrowRight } from "lucide-react";
import type { Campaign } from "@shared/schema";
import { COUNTRIES } from "./create-campaign";
import { AIStoryBuilder } from "@/components/ai-story-builder";
import { ImageUpload } from "@/components/image-upload";

interface SubscriptionInfo {
  subscription: { id: string; planId: string; status: string };
  plan: { id: string; tierCode: string; name: string };
}

const editCampaignSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  goalAmount: z.coerce.number().min(1, "Goal amount is required"),
  country: z.string().min(1, "Country is required"),
  currency: z.string().min(1, "Currency is required"),
  category: z.string().optional(),
  status: z.enum(["active", "paused", "completed"]),
  startDate: z.string().optional().transform(val => val ? new Date(val).toISOString() : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val).toISOString() : undefined),
  quickDonationButtons: z.array(z.object({
    amount: z.coerce.number().min(1, "Amount must be at least 1"),
    description: z.string().optional(),
  })).optional(),
});

type EditCampaignData = z.infer<typeof editCampaignSchema>;

export default function EditCampaignPage() {
  const params = useParams();
  const campaignId = params.id;
  const [, navigate] = useLocation();
  const { toast } = useToast();

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

  const { data: campaign, isLoading } = useQuery<Campaign>({
    queryKey: ["/api/campaigns", campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}`);
      if (!res.ok) throw new Error("Failed to fetch campaign");
      return res.json();
    },
    enabled: !!campaignId,
  });

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
              <h2 className="text-2xl font-bold">Upgrade to Edit Campaigns</h2>
              <p className="text-muted-foreground max-w-md">
                Campaign management is a premium feature. Upgrade your plan to edit 
                and manage fundraising campaigns.
              </p>
            </div>
            <Button size="lg" onClick={() => navigate("/dashboard/subscription")} data-testid="button-upgrade-edit-campaign">
              View Plans & Upgrade
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const form = useForm<EditCampaignData>({
    resolver: zodResolver(editCampaignSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      goalAmount: "",
      country: "USD",
      currency: "USD",
      category: "",
      status: "active",
      startDate: "",
      endDate: "",
      quickDonationButtons: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "quickDonationButtons",
  });

  const hasLoadedRef = useRef(false);

  // Reset form when campaign data is loaded (only once)
  useEffect(() => {
    if (campaign && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      
      const startDate = campaign.startDate 
        ? new Date(campaign.startDate).toISOString().split('T')[0]
        : "";
      const endDate = campaign.endDate 
        ? new Date(campaign.endDate).toISOString().split('T')[0]
        : "";
      
      const quickButtons = Array.isArray(campaign.quickDonationButtons) 
        ? (campaign.quickDonationButtons as any[])
        : [];
      
      form.reset({
        title: campaign.title || "",
        description: campaign.description || "",
        imageUrl: campaign.imageUrl || "",
        goalAmount: String(campaign.goalAmount || ""),
        country: campaign.country || "USD",
        currency: campaign.currency || "USD",
        category: campaign.category || "",
        status: (campaign.status as "active" | "paused" | "completed") || "active",
        startDate,
        endDate,
        quickDonationButtons: quickButtons,
      });
    }
  }, [campaign, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: EditCampaignData) => {
      const res = await apiRequest("PATCH", `/api/campaigns/${campaignId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"], exact: false });
      toast({
        title: "Campaign Updated",
        description: "Your campaign has been updated successfully.",
      });
      navigate("/dashboard/campaigns");
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: EditCampaignData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Campaign not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/dashboard/campaigns")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-edit-campaign-title">Edit Campaign</h1>
          <p className="text-muted-foreground">Update your campaign details</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update your campaign's title and description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Campaign title"
                        {...field}
                        data-testid="input-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel>Description</FormLabel>
                      <AIStoryBuilder
                        campaignId={campaignId!}
                        currentDescription={form.getValues("description")}
                        onDescriptionUpdated={(newDescription) => {
                          form.setValue("description", newDescription);
                        }}
                      />
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Campaign description"
                        rows={6}
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Education, Health, Community"
                        {...field}
                        data-testid="input-category"
                      />
                    </FormControl>
                    <FormDescription>
                      Optional: Helps donors find your campaign
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Banner Image */}
          <Card>
            <CardHeader>
              <CardTitle>Banner Image</CardTitle>
              <CardDescription>Upload a compelling hero image for your campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ImageUpload
                        value={field.value}
                        onChange={field.onChange}
                        label="Campaign Banner"
                        description="Upload an image that tells your story (recommended: 1200x600px)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Details</CardTitle>
              <CardDescription>Set your fundraising goal and currency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="goalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="50000"
                        {...field}
                        data-testid="input-goal-amount"
                      />
                    </FormControl>
                    <FormDescription>
                      The total amount you aim to raise
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-country">
                            <SelectValue placeholder="Select a country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COUNTRIES.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name} ({country.symbol})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-currency">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COUNTRIES.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.code} ({country.symbol})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Currency for donations and payouts
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Campaign Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Schedule</CardTitle>
              <CardDescription>Set start and end dates for your campaign (optional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          data-testid="input-start-date"
                        />
                      </FormControl>
                      <FormDescription>
                        When your campaign begins
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          data-testid="input-end-date"
                        />
                      </FormControl>
                      <FormDescription>
                        When your campaign ends
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Donation Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Donation Buttons</CardTitle>
              <CardDescription>
                Add preset donation amounts to make giving easier for donors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-start">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`quickDonationButtons.${index}.amount`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="100"
                              {...field}
                              data-testid={`input-quick-amount-${index}`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`quickDonationButtons.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Feeds 5 families"
                              {...field}
                              data-testid={`input-quick-description-${index}`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => remove(index)}
                    className="mt-8"
                    data-testid={`button-remove-quick-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() => append({ amount: 0, description: "" })}
                data-testid="button-add-quick-donation"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Donation Button
              </Button>

              <FormDescription>
                These preset amounts appear as quick-select buttons on your donation form, making it easier for donors to contribute.
              </FormDescription>
            </CardContent>
          </Card>

          {/* Campaign Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Settings</CardTitle>
              <CardDescription>Control your campaign's visibility and status</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active - Accepting donations</SelectItem>
                        <SelectItem value="paused">Paused - Temporarily disabled</SelectItem>
                        <SelectItem value="completed">Completed - Goal reached</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Active campaigns appear on your public page and accept donations
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="sticky bottom-0 bg-background border-t p-4 -mx-8">
            <div className="max-w-4xl mx-auto">
              <Button
                type="submit"
                className="w-full"
                disabled={updateMutation.isPending}
                data-testid="button-save"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
