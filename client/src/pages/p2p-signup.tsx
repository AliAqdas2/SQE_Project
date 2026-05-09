import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Campaign } from "@shared/schema";

const signupSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  goal: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Goal must be a positive number"),
  story: z.string().optional(),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function P2PSignupPage() {
  const [, params] = useRoute("/p2p/signup/:campaignId");
  const campaignId = params?.campaignId;
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  const [participantSlug, setParticipantSlug] = useState<string | null>(null);

  // Fetch campaign details
  const { data: campaign, isLoading: campaignLoading } = useQuery<Campaign>({
    queryKey: [`/api/campaigns/public/${campaignId}`],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/public/${campaignId}`);
      if (!res.ok) throw new Error("Failed to fetch campaign");
      return res.json();
    },
    enabled: !!campaignId,
  });

  // Fetch P2P settings
  const { data: p2pSettings } = useQuery({
    queryKey: [`/api/public/p2p/campaigns/${campaignId}/settings`],
    enabled: !!campaignId,
  });

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      goal: "",
      story: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupFormData) => {
      const res = await apiRequest("POST", `/api/public/p2p/campaigns/${campaignId}/signup`, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        goal: data.goal,
        story: data.story || undefined,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setIsSuccess(true);
      setParticipantSlug(data.slug);
      toast({
        title: "Fundraiser Created!",
        description: "Your fundraising page has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create fundraiser. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (campaignLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!campaign || !p2pSettings?.isEnabled || !p2pSettings?.allowSelfSignup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-4xl font-bold">Fundraising Not Available</h1>
          <p className="text-muted-foreground">
            This campaign is not currently accepting new fundraisers.
          </p>
          {campaign && (
            <Link href={`/c/${campaign.slug || 'campaign'}/${campaign.id}`}>
              <Button variant="outline">Back to Campaign</Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (isSuccess && participantSlug) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <Card>
            <CardContent className="pt-6 text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Fundraiser Created!</h2>
                <p className="text-muted-foreground">
                  Your fundraising page has been created. You can now customize it and start sharing!
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href={`/p2p/${participantSlug}`}>
                  <Button size="lg" className="w-full sm:w-auto">
                    View Your Page
                  </Button>
                </Link>
                <Link href={`/c/${campaign.slug || 'campaign'}/${campaign.id}`}>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Back to Campaign
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Link href={`/c/${campaign.slug || 'campaign'}/${campaign.id}`}>
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaign
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Start Your Own Fundraiser</CardTitle>
            <CardDescription>
              Create your personal fundraising page for {campaign.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit((data) => signupMutation.mutate(data))}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    {...form.register("firstName")}
                    placeholder="John"
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    {...form.register("lastName")}
                    placeholder="Doe"
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="john@example.com"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal">Fundraising Goal *</Label>
                <Input
                  id="goal"
                  type="number"
                  step="0.01"
                  min="1"
                  {...form.register("goal")}
                  placeholder="1000"
                />
                <p className="text-sm text-muted-foreground">
                  Set a goal that motivates you and your network
                </p>
                {form.formState.errors.goal && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.goal.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="story">Your Story (Optional)</Label>
                <Textarea
                  id="story"
                  {...form.register("story")}
                  placeholder="Why are you fundraising? Share your personal connection to this cause..."
                  rows={5}
                />
                <p className="text-sm text-muted-foreground">
                  A personal story helps connect with potential donors
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={signupMutation.isPending}
                size="lg"
              >
                {signupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Fundraiser"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
