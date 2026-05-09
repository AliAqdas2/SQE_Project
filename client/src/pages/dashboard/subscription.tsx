import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, ArrowUp, Users, Calendar, CreditCard, TrendingUp, Crown, Zap, Check } from "lucide-react";
import { getCurrencySymbol } from "@shared/location-constants";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

type SubscriptionPlan = {
  id: string;
  tierCode: string;
  name: string;
  description: string;
  baseMonthlyPrice: string;
  baseYearlyPrice: string;
  currency: string;
  minMembers: number;
  maxMembers: number | null;
};

type OrganizationSubscription = {
  id: string;
  orgId: string;
  planId: string;
  billingCycle: string;
  memberCount: number;
  autoUpgradeQueued: boolean;
};

type SubscriptionInfo = {
  subscription: OrganizationSubscription;
  plan: SubscriptionPlan;
  usagePercentage: number;
  recommendedTier: SubscriptionPlan | null;
};

type PlanPricing = {
  currency: string;
  monthlyPrice: string;
  yearlyPrice: string;
};

type AvailablePlan = SubscriptionPlan & {
  pricing: {
    GBP: PlanPricing | null;
    USD: PlanPricing | null;
    AED: PlanPricing | null;
  };
};

type AvailablePlansResponse = {
  currentPlan: SubscriptionPlan;
  availablePlans: AvailablePlan[];
  currentMemberCount: number;
  defaultCurrency: 'GBP' | 'USD' | 'AED';
};

export default function SubscriptionPage() {
  const { toast } = useToast();
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedCurrency, setSelectedCurrency] = useState<'GBP' | 'USD' | 'AED'>('GBP');
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<AvailablePlan | null>(null);
  const hasInitializedCurrency = useRef(false);

  const { data: session, isLoading: sessionLoading } = useQuery<{ user: { orgId: string } }>({
    queryKey: ["/api/auth/session"],
  });

  const orgId = session?.user?.orgId;

  // Check for subscription checkout success/error in URL
  useEffect(() => {
    if (!orgId) return;
    
    const searchParams = new URLSearchParams(window.location.search);
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const sessionId = searchParams.get('session_id');

    if (success === 'true') {
      toast({
        title: "Subscription Successful!",
        description: "Your subscription has been activated. All marketplace modules are now unlocked.",
      });
      // Clear the query params from URL
      window.history.replaceState({}, '', '/dashboard/subscription');
      // Invalidate queries to refresh subscription data
      queryClient.invalidateQueries({ queryKey: ["/api/org", orgId, "subscription"] });
      queryClient.invalidateQueries({ queryKey: ["/api/org", orgId, "subscription", "available-plans"] });
    }

    if (canceled === 'true') {
      toast({
        title: "Checkout Canceled",
        description: "Your subscription checkout was canceled. No charges were made.",
        variant: "default",
      });
      // Clear the query params from URL
      window.history.replaceState({}, '', '/dashboard/subscription');
    }
  }, [orgId, toast]);

  const { data: subscriptionInfo, isLoading: subscriptionLoading, error: subscriptionError } = useQuery<SubscriptionInfo>({
    queryKey: ["/api/org", orgId, "subscription"],
    enabled: !!orgId,
    retry: 1, // Retry once on failure
    // Don't throw error - we'll handle it gracefully and show available plans
    throwOnError: false,
  });

  const { data: availablePlansData, isLoading: plansLoading, error: plansError } = useQuery<AvailablePlansResponse>({
    queryKey: ["/api/org", orgId, "subscription", "available-plans"],
    enabled: !!orgId,
    retry: 1, // Retry once on failure
    onSuccess: (data) => {
      // Set default currency from organization settings (only on first load)
      if (data?.defaultCurrency && !hasInitializedCurrency.current) {
        // Ensure currency is supported (GBP, USD, AED)
        const supportedCurrencies: ('GBP' | 'USD' | 'AED')[] = ['GBP', 'USD', 'AED'];
        const safeCurrency = supportedCurrencies.includes(data.defaultCurrency) 
          ? data.defaultCurrency 
          : 'GBP';
        setSelectedCurrency(safeCurrency);
        hasInitializedCurrency.current = true;
      }
    },
  });

  const isLoading = sessionLoading || subscriptionLoading;

  const updateMemberCountMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/org/${orgId}/subscription/update-member-count`),
    onSuccess: (data: any) => {
      toast({
        title: "Success",
        description: data.message || "Member count updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/org", orgId, "subscription"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update member count",
        variant: "destructive",
      });
    },
  });

  const createCheckoutMutation = useMutation({
    mutationFn: async (data: { planId: string; billingCycle: string; currency: string }) => {
      const response = await apiRequest("POST", `/api/org/${orgId}/subscription/create-checkout`, data);
      return response.json();
    },
    onSuccess: (data: { sessionId: string; url: string }) => {
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast({
        title: "Checkout Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/org/${orgId}/subscription/cancel`);
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Subscription Canceled",
        description: data.message || "Your subscription will be canceled at the end of the billing period",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/org", orgId, "subscription"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If subscription info is not available, still show available plans
  // The subscription endpoint should return a default free tier structure, but handle gracefully if it doesn't
  const subscription = subscriptionInfo?.subscription;
  const plan = subscriptionInfo?.plan;
  const usagePercentage = subscriptionInfo?.usagePercentage || 0;
  const recommendedTier = subscriptionInfo?.recommendedTier || null;
  
  // If we have available plans data, show the page even without subscription info
  const canShowPage = subscriptionInfo || availablePlansData;
  
  // If subscription API failed but we have available plans, still show the page
  // Create default free tier structure if needed
  const defaultFreePlan: SubscriptionPlan = {
    id: 'default-free',
    tierCode: 'free',
    name: 'Free',
    description: 'Perfect for getting started with up to 100 members. Includes Donor CRM, Contacts, and Landing Page.',
    baseMonthlyPrice: '0.00',
    baseYearlyPrice: '0.00',
    currency: 'GBP',
    minMembers: 0,
    maxMembers: 100,
  };
  
  const defaultFreeSubscription: OrganizationSubscription = {
    id: 'default-free',
    orgId: orgId || '',
    planId: 'default-free',
    billingCycle: 'monthly',
    memberCount: 0,
    autoUpgradeQueued: false,
  };
  
  // Use defaults if subscription info is missing but we have available plans
  const effectivePlan = plan || (availablePlansData ? defaultFreePlan : null);
  const effectiveSubscription = subscription || (availablePlansData ? defaultFreeSubscription : null);
  
  if (!canShowPage && !plansLoading && !subscriptionLoading) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTitle>No subscription found</AlertTitle>
          <AlertDescription>
            Your organization does not have an active subscription. Please contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If we don't have subscription/plan but have available plans, still show the page
  // This allows users to see and upgrade to plans even if their current subscription is missing
  if (!effectiveSubscription || !effectivePlan) {
    // Only show error if we also don't have available plans
    if (!availablePlansData || availablePlansData.availablePlans.length === 0) {
      return (
        <div className="container mx-auto p-6">
          <Alert>
            <AlertTitle>Invalid subscription data</AlertTitle>
            <AlertDescription>
              Unable to load subscription information. Please try refreshing the page or contact support.
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    // Otherwise, continue to show available plans - use default values
  }

  const isNearLimit = usagePercentage > 80;
  const isOverLimit = usagePercentage > 100;
  const isFreeTier = effectivePlan?.tierCode === 'free' || !effectivePlan;
  const monthlyPrice = effectivePlan ? parseFloat(effectivePlan.baseMonthlyPrice) : 0;
  const yearlyPrice = effectivePlan ? parseFloat(effectivePlan.baseYearlyPrice) : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-subscription-title">
            Subscription
          </h1>
          <p className="text-muted-foreground">
            Manage your subscription and view usage
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => updateMemberCountMutation.mutate()}
          disabled={updateMemberCountMutation.isPending}
          data-testid="button-refresh-member-count"
        >
          {updateMemberCountMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Member Count
            </>
          )}
        </Button>
      </div>

      {/* Show message if no subscription exists */}
      {!subscription && !subscriptionLoading && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-800 dark:text-blue-200">No Active Subscription</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            You're currently on the free plan. Subscribe to a paid plan below to unlock all marketplace modules and expand your organization's capabilities.
          </AlertDescription>
        </Alert>
      )}

      {effectiveSubscription?.autoUpgradeQueued && (
        <Alert data-testid="alert-upgrade-queued">
          <TrendingUp className="h-4 w-4" />
          <AlertTitle>Upgrade Recommended</AlertTitle>
          <AlertDescription>
            Your organization has exceeded the member limit for your current tier.
            An upgrade to {recommendedTier?.name} has been queued. Please contact support to complete the upgrade.
          </AlertDescription>
        </Alert>
      )}

      {isNearLimit && !isOverLimit && !effectiveSubscription?.autoUpgradeQueued && (
        <Alert data-testid="alert-near-limit">
          <AlertTitle>Approaching Member Limit</AlertTitle>
          <AlertDescription>
            You are using {usagePercentage.toFixed(0)}% of your member capacity.
            Consider upgrading to avoid service interruption.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-current-plan">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{effectivePlan?.name || 'Free'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {effectivePlan?.tierCode || 'free'}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-member-count">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{effectiveSubscription?.memberCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              of {effectivePlan?.maxMembers || '∞'} members
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-billing-cycle">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billing</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isFreeTier ? 'FREE' : capitalize(effectiveSubscription?.billingCycle || 'monthly')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isFreeTier ? (
                'No payment required'
              ) : (
                <>
                  {getCurrencySymbol(effectivePlan?.currency || availablePlansData?.defaultCurrency || 'GBP')}{effectiveSubscription?.billingCycle === 'monthly' 
                    ? monthlyPrice.toFixed(2) 
                    : yearlyPrice.toFixed(2)}
                  /{effectiveSubscription?.billingCycle === 'monthly' ? 'mo' : 'yr'}
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-usage">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usagePercentage.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {isOverLimit ? 'Over limit' : 'of capacity'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-plan-details">
        <CardHeader>
          <CardTitle>Plan Details</CardTitle>
          <CardDescription>{effectivePlan?.description || 'Free tier plan'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Member Capacity</span>
              <span className="text-sm text-muted-foreground">
                {effectiveSubscription?.memberCount || 0} / {effectivePlan?.maxMembers || '∞'}
              </span>
            </div>
            <Progress 
              value={Math.min(usagePercentage, 100)} 
              className="h-2"
              data-testid="progress-usage"
            />
            {isOverLimit && (
              <p className="text-sm text-destructive mt-2">
                You have exceeded your member limit. Please upgrade your plan.
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">Member Range</div>
              <div className="text-lg font-semibold">
                {effectivePlan?.minMembers || 0} - {effectivePlan?.maxMembers || '∞'} members
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Included Features</div>
              <div className="text-lg font-semibold">
                {isFreeTier ? 'Donor CRM, Contacts, Landing Page' : 'All Marketplace Modules'}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">Monthly Price</div>
              <div className="text-lg font-semibold">
                {isFreeTier ? (
                  'FREE'
                ) : (
                  `${getCurrencySymbol(effectivePlan?.currency || availablePlansData?.defaultCurrency || 'GBP')}${monthlyPrice.toFixed(2)} / month`
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Yearly Price</div>
              <div className="text-lg font-semibold">
                {isFreeTier ? (
                  'FREE'
                ) : (
                  <>
                    {getCurrencySymbol(effectivePlan?.currency || availablePlansData?.defaultCurrency || 'GBP')}{yearlyPrice.toFixed(2)} / year
                    <span className="text-sm text-muted-foreground ml-2">(10% savings)</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Subscription Section - Only for paid tiers with actual subscription */}
      {!isFreeTier && subscription && plan && (
        <Card data-testid="card-cancel-subscription">
          <CardHeader>
            <CardTitle>Cancel Subscription</CardTitle>
            <CardDescription>
              Cancel your subscription at the end of the current billing period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => cancelSubscriptionMutation.mutate()}
              disabled={cancelSubscriptionMutation.isPending}
              data-testid="button-cancel-subscription"
            >
              {cancelSubscriptionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Canceling...
                </>
              ) : (
                "Cancel Subscription"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plan Change Section - Show for all tiers */}
      {availablePlansData && availablePlansData.availablePlans.length > 0 && (
        <div className="space-y-6">
          {/* Hero Callout for FREE Tier Only */}
          {isFreeTier && (
            <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20" data-testid="card-upgrade-callout">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Unlock Full Platform Access</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Upgrade to access all marketplace modules and grow with your community
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-primary/10 rounded">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">All Modules Unlocked</div>
                    <p className="text-sm text-muted-foreground">Events, Livestream, Sermons, Activities & more</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-primary/10 rounded">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">Advanced Features</div>
                    <p className="text-sm text-muted-foreground">AI-powered tools, analytics & automation</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-primary/10 rounded">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">Scale Your Community</div>
                    <p className="text-sm text-muted-foreground">Support for up to 5000+ members</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Plan Change Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold">Choose Your Plan</h2>
                <p className="text-muted-foreground">Select the tier that fits your community size</p>
              </div>
              <div className="flex items-center gap-4">
                <Tabs value={selectedCurrency} onValueChange={(v) => setSelectedCurrency(v as 'GBP' | 'USD' | 'AED')} data-testid="tabs-currency">
                  <TabsList>
                    <TabsTrigger value="GBP" data-testid="tab-gbp">GBP (£)</TabsTrigger>
                    <TabsTrigger value="USD" data-testid="tab-usd">USD ($)</TabsTrigger>
                    <TabsTrigger value="AED" data-testid="tab-aed">AED (د.إ)</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Tabs value={selectedBillingCycle} onValueChange={(v) => setSelectedBillingCycle(v as "monthly" | "yearly")} data-testid="tabs-billing-cycle">
                  <TabsList>
                    <TabsTrigger value="monthly" data-testid="tab-monthly">Monthly</TabsTrigger>
                    <TabsTrigger value="yearly" data-testid="tab-yearly">
                      Yearly
                      <Badge variant="secondary" className="ml-2">Save 10%</Badge>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {availablePlansData.availablePlans.map((upgradePlan) => {
                const currencyPricing = upgradePlan.pricing[selectedCurrency];
                const price = selectedBillingCycle === "monthly" 
                  ? currencyPricing?.monthlyPrice 
                  : currencyPricing?.yearlyPrice;
                const priceValue = price ? parseFloat(price) : null;
                const currencySymbol = getCurrencySymbol(selectedCurrency);
                const displayPrice = priceValue === 0 ? 'FREE' : priceValue ? `${currencySymbol}${priceValue.toFixed(2)}` : 'N/A';
                
                const isMostPopular = upgradePlan.tierCode === "core";
                const hasSubscription = !!subscription && !!plan;
                const isCurrentPlan = effectivePlan && upgradePlan.id === effectivePlan.id;
                const isFreePlan = upgradePlan.tierCode === 'free';
                const isUpgrade = hasSubscription && upgradePlan.minMembers > (effectivePlan?.minMembers || 0);
                const isDowngrade = hasSubscription && upgradePlan.minMembers < (effectivePlan?.minMembers || 0);
                const isNewSubscription = !hasSubscription;
                // Cannot subscribe to free plan - it's automatic
                const canSubscribe = !isFreePlan;
                
                return (
                  <Card 
                    key={upgradePlan.id} 
                    className={`relative ${isMostPopular ? 'border-primary shadow-lg' : ''} ${isCurrentPlan ? 'opacity-60' : ''}`}
                    data-testid={`card-plan-${upgradePlan.tierCode}`}
                  >
                    {isMostPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="gap-1">
                          <Crown className="h-3 w-3" />
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl">{upgradePlan.name}</CardTitle>
                          <Badge variant="outline" className="mt-2">{upgradePlan.tierCode}</Badge>
                        </div>
                      </div>
                      <CardDescription className="mt-2">{upgradePlan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="text-3xl font-bold">
                          {displayPrice}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {priceValue === 0 ? '' : `per ${selectedBillingCycle === "monthly" ? "month" : "year"}`}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{upgradePlan.minMembers} - {upgradePlan.maxMembers || '∞'} members</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-muted-foreground" />
                          <span>All Marketplace Modules</span>
                        </div>
                      </div>

                      {(effectiveSubscription?.memberCount || 0) >= upgradePlan.minMembers && 
                       (effectiveSubscription?.memberCount || 0) <= (upgradePlan.maxMembers || Infinity) && !isCurrentPlan && (
                        <Badge variant="secondary" className="w-full justify-center">
                          <ArrowUp className="h-3 w-3 mr-1" />
                          Recommended for your size
                        </Badge>
                      )}

                      {isCurrentPlan && (
                        <Badge variant="default" className="w-full justify-center">
                          Current Plan
                        </Badge>
                      )}

                      <Button 
                        className="w-full" 
                        variant={isMostPopular ? "default" : "outline"}
                        onClick={() => {
                          setSelectedUpgradePlan(upgradePlan);
                          setUpgradeDialogOpen(true);
                        }}
                        disabled={isCurrentPlan || !canSubscribe}
                        data-testid={`button-${isNewSubscription ? 'subscribe' : isUpgrade ? 'upgrade' : 'downgrade'}-${upgradePlan.tierCode}`}
                      >
                        {isCurrentPlan 
                          ? 'Current Plan' 
                          : !canSubscribe
                            ? 'Free plan is automatic'
                          : isNewSubscription 
                            ? `Subscribe to ${upgradePlan.name}`
                            : isUpgrade 
                              ? `Upgrade to ${upgradePlan.name}`
                              : `Downgrade to ${upgradePlan.name}`
                        }
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Plan Change Confirmation Dialog */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent data-testid="dialog-upgrade-confirm">
          <DialogHeader>
            <DialogTitle>
              {(() => {
                if (!selectedUpgradePlan) return 'Subscribe to Plan';
                const hasSubscription = !!subscription && !!plan;
                if (!hasSubscription) return `Subscribe to ${selectedUpgradePlan.name}`;
                const isUpgrade = selectedUpgradePlan.minMembers > (effectivePlan?.minMembers || 0);
                return isUpgrade ? `Upgrade to ${selectedUpgradePlan.name}` : `Downgrade to ${selectedUpgradePlan.name}`;
              })()}
            </DialogTitle>
            <DialogDescription>
              {(() => {
                const hasSubscription = !!subscription && !!plan;
                return hasSubscription 
                  ? 'Review your plan change details before proceeding to checkout'
                  : 'Review your subscription details before proceeding to checkout';
              })()}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUpgradePlan && (() => {
            const currencyPricing = selectedUpgradePlan.pricing[selectedCurrency];
            const price = selectedBillingCycle === "monthly" 
              ? currencyPricing?.monthlyPrice 
              : currencyPricing?.yearlyPrice;
            const priceValue = price ? parseFloat(price) : 0;
            const currencySymbol = getCurrencySymbol(selectedCurrency);
            const displayPrice = priceValue === 0 ? 'FREE' : `${currencySymbol}${priceValue.toFixed(2)}`;
            
            return (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-semibold">{selectedUpgradePlan.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Currency</span>
                    <span className="font-semibold">{selectedCurrency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Billing Cycle</span>
                    <span className="font-semibold">{capitalize(selectedBillingCycle)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Member Capacity</span>
                    <span className="font-semibold">
                      {selectedUpgradePlan.minMembers} - {selectedUpgradePlan.maxMembers || '∞'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-semibold">
                      {displayPrice}
                      {priceValue === 0 ? '' : selectedBillingCycle === "monthly" ? '/mo' : '/yr'}
                    </span>
                  </div>
                </div>

                <Alert>
                  <AlertDescription>
                    {(() => {
                      const hasSubscription = !!subscription && !!plan;
                      if (hasSubscription) {
                        return (
                          <>
                    <strong>Pro-ration:</strong> You'll be charged immediately and your billing cycle will start today.
                    All marketplace modules will be unlocked instantly.
                          </>
                        );
                      } else {
                        return (
                          <>
                            <strong>New Subscription:</strong> You'll be charged immediately and your billing cycle will start today.
                            All marketplace modules will be unlocked instantly upon successful payment.
                          </>
                        );
                      }
                    })()}
                  </AlertDescription>
                </Alert>
              </div>
            );
          })()}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setUpgradeDialogOpen(false)}
              data-testid="button-cancel-upgrade"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (!selectedUpgradePlan) return;
                createCheckoutMutation.mutate({
                  planId: selectedUpgradePlan.id,
                  billingCycle: selectedBillingCycle,
                  currency: selectedCurrency,
                });
              }}
              disabled={createCheckoutMutation.isPending}
              data-testid="button-proceed-checkout"
            >
              {createCheckoutMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Proceed to Checkout
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {recommendedTier && (
        <Card data-testid="card-recommended-tier">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ArrowUp className="h-5 w-5" />
              <CardTitle>Recommended Upgrade</CardTitle>
            </div>
            <CardDescription>
              Based on your current member count, we recommend upgrading to the following tier
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{recommendedTier.name}</div>
                <p className="text-sm text-muted-foreground">{recommendedTier.description}</p>
              </div>
              <Badge variant="default" className="text-base px-4 py-2">
                {recommendedTier.tierCode}
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-sm text-muted-foreground">Member Range</div>
                <div className="text-lg font-semibold">
                  {recommendedTier.minMembers} - {recommendedTier.maxMembers || '∞'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Monthly Price</div>
                <div className="text-lg font-semibold">
                  {getCurrencySymbol(recommendedTier.currency || availablePlansData?.defaultCurrency || 'GBP')}{parseFloat(recommendedTier.baseMonthlyPrice).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Yearly Price</div>
                <div className="text-lg font-semibold">
                  {getCurrencySymbol(recommendedTier.currency || availablePlansData?.defaultCurrency || 'GBP')}{parseFloat(recommendedTier.baseYearlyPrice).toFixed(2)}
                </div>
              </div>
            </div>

            <Button className="w-full" data-testid="button-contact-support">
              <CreditCard className="mr-2 h-4 w-4" />
              Contact Support to Upgrade
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
