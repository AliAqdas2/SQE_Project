import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Loader2, Wand2, Eye, Save, Crown, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { GoalOptimizer } from "@/components/goal-optimizer";

interface SubscriptionInfo {
  subscription: { id: string; planId: string; status: string };
  plan: { id: string; tierCode: string; name: string };
}

export const COUNTRIES = [
  { code: "USD", name: "United States", symbol: "$" },
  { code: "GBP", name: "United Kingdom", symbol: "£" },
  { code: "EUR", name: "Eurozone (Germany, France, Italy, Spain, etc.)", symbol: "€" },
  { code: "AED", name: "United Arab Emirates", symbol: "AED" },
  { code: "SAR", name: "Saudi Arabia", symbol: "SAR" },
  { code: "PKR", name: "Pakistan", symbol: "₨" },
  { code: "INR", name: "India", symbol: "₹" },
  { code: "BDT", name: "Bangladesh", symbol: "৳" },
  { code: "ZAR", name: "South Africa", symbol: "R" },
  { code: "NGN", name: "Nigeria", symbol: "₦" },
  { code: "EGP", name: "Egypt", symbol: "E£" },
  { code: "KES", name: "Kenya", symbol: "KSh" },
  { code: "GHS", name: "Ghana", symbol: "GH₵" },
  { code: "CAD", name: "Canada", symbol: "CA$" },
  { code: "AUD", name: "Australia", symbol: "A$" },
  { code: "NZD", name: "New Zealand", symbol: "NZ$" },
  { code: "SGD", name: "Singapore", symbol: "S$" },
  { code: "MYR", name: "Malaysia", symbol: "RM" },
  { code: "IDR", name: "Indonesia", symbol: "Rp" },
  { code: "THB", name: "Thailand", symbol: "฿" },
  { code: "PHP", name: "Philippines", symbol: "₱" },
  { code: "CNY", name: "China", symbol: "¥" },
  { code: "JPY", name: "Japan", symbol: "¥" },
  { code: "KRW", name: "South Korea", symbol: "₩" },
  { code: "BRL", name: "Brazil", symbol: "R$" },
  { code: "MXN", name: "Mexico", symbol: "MX$" },
  { code: "ARS", name: "Argentina", symbol: "AR$" },
  { code: "CLP", name: "Chile", symbol: "CL$" },
  { code: "TRY", name: "Turkey", symbol: "₺" },
  { code: "ILS", name: "Israel", symbol: "₪" },
  { code: "JOD", name: "Jordan", symbol: "JD" },
  { code: "LBP", name: "Lebanon", symbol: "L£" },
  { code: "QAR", name: "Qatar", symbol: "QR" },
  { code: "KWD", name: "Kuwait", symbol: "KD" },
  { code: "BHD", name: "Bahrain", symbol: "BD" },
  { code: "OMR", name: "Oman", symbol: "OMR" },
  { code: "CHF", name: "Switzerland", symbol: "CHF" },
  { code: "SEK", name: "Sweden", symbol: "kr" },
  { code: "NOK", name: "Norway", symbol: "kr" },
  { code: "DKK", name: "Denmark", symbol: "kr" },
  { code: "PLN", name: "Poland", symbol: "zł" },
  { code: "CZK", name: "Czech Republic", symbol: "Kč" },
  { code: "HUF", name: "Hungary", symbol: "Ft" },
  { code: "RUB", name: "Russia", symbol: "₽" },
  { code: "UAH", name: "Ukraine", symbol: "₴" },
  { code: "RON", name: "Romania", symbol: "lei" },
  { code: "BGN", name: "Bulgaria", symbol: "лв" },
  { code: "HRK", name: "Croatia", symbol: "kn" },
  { code: "RSD", name: "Serbia", symbol: "din" },
  { code: "LKR", name: "Sri Lanka", symbol: "Rs" },
  { code: "NPR", name: "Nepal", symbol: "Rs" },
  { code: "AFN", name: "Afghanistan", symbol: "Af" },
  { code: "IQD", name: "Iraq", symbol: "IQD" },
  { code: "IRR", name: "Iran", symbol: "IRR" },
  { code: "SYP", name: "Syria", symbol: "S£" },
  { code: "YER", name: "Yemen", symbol: "YR" },
  { code: "TZS", name: "Tanzania", symbol: "TSh" },
  { code: "UGX", name: "Uganda", symbol: "USh" },
  { code: "ETB", name: "Ethiopia", symbol: "Br" },
  { code: "MAD", name: "Morocco", symbol: "MAD" },
  { code: "DZD", name: "Algeria", symbol: "DA" },
  { code: "TND", name: "Tunisia", symbol: "DT" },
  { code: "LYD", name: "Libya", symbol: "LD" },
  { code: "SDG", name: "Sudan", symbol: "SDG" },
  { code: "SOS", name: "Somalia", symbol: "Sh" },
  { code: "ZMW", name: "Zambia", symbol: "ZK" },
  { code: "ZWL", name: "Zimbabwe", symbol: "Z$" },
  { code: "BWP", name: "Botswana", symbol: "P" },
  { code: "MWK", name: "Malawi", symbol: "MK" },
  { code: "MZN", name: "Mozambique", symbol: "MT" },
  { code: "ANG", name: "Netherlands Antilles", symbol: "ƒ" },
  { code: "AWG", name: "Aruba", symbol: "ƒ" },
  { code: "BBD", name: "Barbados", symbol: "Bds$" },
  { code: "BMD", name: "Bermuda", symbol: "BD$" },
  { code: "BSD", name: "Bahamas", symbol: "B$" },
  { code: "BZD", name: "Belize", symbol: "BZ$" },
  { code: "COP", name: "Colombia", symbol: "COL$" },
  { code: "CRC", name: "Costa Rica", symbol: "₡" },
  { code: "CUP", name: "Cuba", symbol: "$MN" },
  { code: "DOP", name: "Dominican Republic", symbol: "RD$" },
  { code: "GTQ", name: "Guatemala", symbol: "Q" },
  { code: "HNL", name: "Honduras", symbol: "L" },
  { code: "HTG", name: "Haiti", symbol: "G" },
  { code: "JMD", name: "Jamaica", symbol: "J$" },
  { code: "NIO", name: "Nicaragua", symbol: "C$" },
  { code: "PAB", name: "Panama", symbol: "B/." },
  { code: "PEN", name: "Peru", symbol: "S/." },
  { code: "PYG", name: "Paraguay", symbol: "₲" },
  { code: "TTD", name: "Trinidad and Tobago", symbol: "TT$" },
  { code: "UYU", name: "Uruguay", symbol: "$U" },
  { code: "VEF", name: "Venezuela", symbol: "Bs" },
];

const conversationalSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  briefDescription: z.string().min(20, "Description must be at least 20 characters"),
  country: z.string().min(1, "Please select a country"),
  currency: z.string().min(1, "Please select a currency"),
  target: z.string().min(1, "Please enter a target amount"),
});

type ConversationalFormData = z.infer<typeof conversationalSchema>;

interface QuickDonation {
  amount: number;
  description: string;
}

interface GeneratedContent {
  description: string;
  quickDonations: QuickDonation[];
  bannerPrompt: string;
  bannerImage: string;
}

import { CampaignPageBuilder, type PageComponent } from "@/components/campaign-page-builder";

export default function CreateCampaignPage() {
  const [step, setStep] = useState<"conversational" | "generated" | "builder">("conversational");
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [pageComponents, setPageComponents] = useState<PageComponent[]>([]);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Get current user session
  const { data: session} = useQuery<{ user: { id: string; orgId: string; email: string } }>({
    queryKey: ["/api/auth/session"],
  });

  // Fetch organization to get default currency
  const { data: organization } = useQuery<{ currency: string }>({
    queryKey: ["/api/org", session?.user?.orgId],
    enabled: !!session?.user?.orgId,
  });

  // Check subscription status
  const { data: subscriptionInfo, isLoading: subscriptionLoading } = useQuery<SubscriptionInfo>({
    queryKey: ["/api/org", session?.user?.orgId, "subscription"],
    enabled: !!session?.user?.orgId,
  });

  const isFreePlan = subscriptionInfo?.plan?.tierCode?.toLowerCase() === "free";

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
              <h2 className="text-2xl font-bold">Upgrade to Create Campaigns</h2>
              <p className="text-muted-foreground max-w-md">
                Campaign management is a premium feature. Upgrade your plan to create 
                and manage fundraising campaigns with AI-powered tools.
              </p>
            </div>
            <Button size="lg" onClick={() => navigate("/dashboard/subscription")} data-testid="button-upgrade-create-campaign">
              View Plans & Upgrade
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const form = useForm<ConversationalFormData>({
    resolver: zodResolver(conversationalSchema),
    defaultValues: {
      title: "",
      briefDescription: "",
      country: "",
      currency: organization?.currency || "USD",
      target: "",
    },
  });

  // Update currency default when organization data loads and keep it locked to org currency
  useEffect(() => {
    if (organization?.currency) {
      form.setValue("currency", organization.currency);
    }
  }, [organization?.currency, form]);

  // Watch country changes and ensure currency stays as organization currency
  const countryValue = form.watch("country");
  useEffect(() => {
    // Always reset currency to organization currency when country changes
    if (organization?.currency) {
      form.setValue("currency", organization.currency);
    }
  }, [countryValue, organization?.currency, form]);

  const generateMutation = useMutation({
    mutationFn: async (data: ConversationalFormData) => {
      // Reset progress
      setProgress(0);
      setGenerationStep("");
      
      return new Promise((resolve, reject) => {
        // Use fetch with streaming response to receive SSE events
        fetch("/api/campaigns/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include cookies for authentication
          body: JSON.stringify(data),
        })
          .then(async (response) => {
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(errorText || `HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            if (!reader) {
              throw new Error("No response body");
            }

            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                // If we reach here without resolving, something went wrong
                if (buffer.trim()) {
                  // Try to parse any remaining data
                  const lines = buffer.split("\n");
                  for (const line of lines) {
                    if (line.startsWith("data: ")) {
                      try {
                        const jsonData = JSON.parse(line.slice(6));
                        if (jsonData.type === "complete") {
                          resolve(jsonData.data);
                          return;
                        }
                      } catch (e) {
                        // Ignore parse errors
                      }
                    }
                  }
                }
                reject(new Error("Stream ended without completion"));
                break;
              }

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || ""; // Keep incomplete line in buffer

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  try {
                    const jsonData = JSON.parse(line.slice(6));
                    
                    // Handle progress updates
                    if (jsonData.progress !== undefined) {
                      setProgress(jsonData.progress);
                      setGenerationStep(jsonData.message);
                    }
                    
                    // Handle completion
                    if (jsonData.type === "complete") {
                      resolve(jsonData.data);
                      return;
                    }
                    
                    // Handle errors
                    if (jsonData.error) {
                      reject(new Error(jsonData.error));
                      return;
                    }
                  } catch (parseError) {
                    // Skip invalid JSON lines
                    console.warn("Failed to parse SSE data:", line);
                  }
                }
              }
            }
          })
          .catch((error) => {
            setProgress(0);
        setGenerationStep("");
            reject(error);
          });
      });
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      setPageComponents([]); // Clear previous components when generating new content
      setStep("generated");
      toast({
        title: "Content Generated!",
        description: "Your campaign has been created with AI. Review and customize it below.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate campaign content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!generatedContent || !session?.user?.orgId) {
        throw new Error("Missing required data");
      }
      
      const formData = form.getValues();
      const campaignData = {
        title: formData.title,
        description: generatedContent.description,
        goalAmount: formData.target,
        country: formData.country,
        currency: organization?.currency || formData.currency, // Always use organization currency
        imageUrl: `data:image/png;base64,${generatedContent.bannerImage}`,
        quickDonationButtons: generatedContent.quickDonations,
        pageComponents: pageComponents,
        status: "active",
        orgId: session.user.orgId,
      };

      const res = await apiRequest("POST", "/api/campaigns", campaignData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Campaign Saved!",
        description: "Your campaign has been saved successfully.",
      });
      // Invalidate all campaign queries
      queryClient.invalidateQueries({ 
        queryKey: ["/api/campaigns"],
        exact: false 
      });
      navigate("/dashboard/campaigns");
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = async (data: ConversationalFormData) => {
    generateMutation.mutate(data);
  };

  const handleSave = () => {
    saveMutation.mutate();
  };

  if (step === "conversational") {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-create-campaign-title">Create New Campaign</h1>
          <p className="text-muted-foreground">
            Let's start with some basic information about your campaign
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleGenerate)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Build a New Community Center"
                          {...field}
                          data-testid="input-campaign-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="briefDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brief Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us briefly about your campaign..."
                          rows={4}
                          {...field}
                          data-testid="input-brief-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <Select 
                        onValueChange={(value) => {
                          // Always reset to organization currency
                          if (organization?.currency) {
                            form.setValue("currency", organization.currency);
                          }
                        }} 
                        value={organization?.currency || field.value}
                        disabled={true}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-currency" className="bg-muted">
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
                      <p className="text-xs text-muted-foreground">
                        Currency is set to your organization's default currency
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="target"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between mb-2">
                        <FormLabel>Target Amount</FormLabel>
                        <GoalOptimizer
                          campaignTitle={form.getValues("title")}
                          campaignDescription={form.getValues("briefDescription")}
                          campaignCountry={form.getValues("country")}
                          onGoalSelected={(amount) => {
                            form.setValue("target", String(amount));
                          }}
                        />
                      </div>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 50000"
                          {...field}
                          data-testid="input-target-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {generateMutation.isPending && (
                  <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Please wait a moment while we build your campaign</span>
                        <span className="text-muted-foreground">{progress}%</span>
                      </div>
                      <Progress value={progress} className="w-full h-2" />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      {progress < 30 && "Analyzing your campaign details..."}
                      {progress >= 30 && progress < 60 && "Generating compelling content..."}
                      {progress >= 60 && progress < 90 && "Creating donation tiers and banner..."}
                      {progress >= 90 && "Finalizing your campaign..."}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={generateMutation.isPending}
                  data-testid="button-generate-campaign"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Campaign...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Campaign with AI
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "generated" && generatedContent) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-generated-title">{form.getValues("title")}</h1>
            <p className="text-muted-foreground">Review your AI-generated campaign</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep("conversational")} data-testid="button-back">
              Back to Edit
            </Button>
            <Button variant="outline" onClick={() => setStep("builder")} data-testid="button-customize">
              Customize Page
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-campaign">
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Campaign
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Banner Image</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={`data:image/png;base64,${generatedContent.bannerImage}`}
                  alt="Campaign banner"
                  className="w-full rounded-md"
                  data-testid="img-banner"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Campaign Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none" data-testid="text-description">
                  {generatedContent.description.split('\n').map((paragraph, i) => (
                    <p key={i} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Target Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-target">
                  {form.getValues("country") === "GBP" && "£"}
                  {form.getValues("country") === "USD" && "$"}
                  {form.getValues("country") === "AED" && "AED "}
                  {form.getValues("country") === "ZAR" && "R"}
                  {parseFloat(form.getValues("target")).toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Donation Buttons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {generatedContent.quickDonations.map((donation, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3"
                    data-testid={`button-quick-donate-${index}`}
                  >
                    <div>
                      <div className="font-bold">
                        {form.getValues("country") === "GBP" && "£"}
                        {form.getValues("country") === "USD" && "$"}
                        {form.getValues("country") === "AED" && "AED "}
                        {form.getValues("country") === "ZAR" && "R"}
                        {donation.amount.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">{donation.description}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (step === "builder" && generatedContent) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{form.getValues("title")}</h1>
            <p className="text-muted-foreground">Customize your campaign page with additional content</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep("generated")} data-testid="button-back-preview">
              Back to Preview
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-final">
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Campaign
                </>
              )}
            </Button>
          </div>
        </div>

        <CampaignPageBuilder
          components={pageComponents}
          onChange={setPageComponents}
        />
      </div>
    );
  }

  return null;
}
