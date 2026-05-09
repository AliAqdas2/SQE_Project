import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Heart, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Campaign } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { STRIPE_PUBLISHABLE_KEY } from "@/lib/Constants";
import { getTaxReliefProgram } from "@shared/constants";
import { Checkbox } from "@/components/ui/checkbox";

const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

const SUGGESTED_AMOUNTS = [25, 50, 100, 250, 500];

function DonationForm({ campaign }: { campaign: Campaign }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/donation/success`,
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Payment failed",
          description: error.message,
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Payment Information</Label>
        <PaymentElement />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!stripe || isProcessing}
        data-testid="button-submit-donation"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Heart className="mr-2 h-4 w-4" />
            Complete Donation
          </>
        )}
      </Button>
    </form>
  );
}

interface CampaignWithOrg extends Campaign {
  organization?: {
    country?: string;
    settings?: { giftAidPercentage?: number } | null;
  };
}

export default function DonatePage() {
  const [, params] = useRoute("/donate/:campaignId");
  const campaignId = params?.campaignId;
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  
  // Gift Aid / Tax Relief state
  const [giftAidOptIn, setGiftAidOptIn] = useState(false);
  const [donorAddress, setDonorAddress] = useState("");
  const [donorTown, setDonorTown] = useState("");
  const [donorState, setDonorState] = useState("");
  const [donorPostcode, setDonorPostcode] = useState("");
  
  const { toast } = useToast();

  // Debug logging
  useEffect(() => {
    console.log("Stripe Public Key:", STRIPE_PUBLISHABLE_KEY);
    console.log("Stripe Promise:", stripePromise);
  }, []);

  useEffect(() => {
    console.log("Client Secret changed:", clientSecret);
  }, [clientSecret]);

  const { data: campaign, isLoading } = useQuery<CampaignWithOrg>({
    queryKey: ["/api/campaigns", campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}`);
      if (!res.ok) throw new Error("Campaign not found");
      return res.json();
    },
    enabled: !!campaignId,
  });
  
  // Get tax relief program for UK organizations
  const isUK = campaign?.organization?.country === "GB";
  const taxReliefProgram = isUK ? getTaxReliefProgram("GB") : null;
  const giftAidPercentage = campaign?.organization?.settings?.giftAidPercentage || 25; // Default to 25%
  
  // Calculate Gift Aid amount (not added to total, just displayed)
  const donationAmount = selectedAmount || parseFloat(customAmount) || 0;
  const giftAidAmount = giftAidOptIn && taxReliefProgram && donationAmount > 0
    ? (donationAmount * (giftAidPercentage / 100))
    : 0;

  const createPaymentIntent = useMutation({
    mutationFn: async (data: { amount: number; donorName: string; donorEmail: string }) => {
      const res = await apiRequest("POST", "/api/create-payment-intent", {
        amount: data.amount,
        campaignId,
        donorName: data.donorName,
        donorEmail: data.donorEmail,
        giftAidOptIn: taxReliefProgram ? giftAidOptIn : false,
        donorAddress: giftAidOptIn ? donorAddress : undefined,
        donorTown: giftAidOptIn ? donorTown : undefined,
        donorState: giftAidOptIn ? donorState : undefined,
        donorPostcode: giftAidOptIn ? donorPostcode : undefined,
      });
      const json = await res.json();
      console.log("Payment Intent Response:", json);
      return json;
    },
    onSuccess: (data: any) => {
      console.log("Setting client secret:", data.clientSecret);
      setClientSecret(data.clientSecret);
      toast({
        title: "Payment Initialized",
        description: "Please enter your payment information",
      });
    },
    onError: (error: any) => {
      console.error("Payment Intent Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initialize payment",
      });
    },
  });

  const handleAmountSelect = (amount: number) => {
    if (!donorName || !donorEmail) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter your name and email first",
      });
      return;
    }
    setSelectedAmount(amount);
    setCustomAmount("");
    createPaymentIntent.mutate({ amount, donorName, donorEmail });
  };

  const handleCustomAmount = () => {
    const amount = parseFloat(customAmount);
    if (!donorName || !donorEmail) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter your name and email first",
      });
      return;
    }
    if (amount && amount > 0) {
      setSelectedAmount(amount);
      createPaymentIntent.mutate({ amount, donorName, donorEmail });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Not Found</CardTitle>
            <CardDescription>The campaign you're looking for doesn't exist.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const percentComplete = Math.min(
    (parseFloat(campaign.currentAmount) / parseFloat(campaign.goalAmount)) * 100,
    100
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Campaign Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              {campaign.imageUrl && (
                <img
                  src={campaign.imageUrl}
                  alt={campaign.title}
                  className="w-24 h-24 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <CardTitle className="text-2xl">{campaign.title}</CardTitle>
                <CardDescription className="mt-2">{campaign.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">${parseFloat(campaign.currentAmount).toLocaleString()}</span>
                <span className="text-muted-foreground">
                  of ${parseFloat(campaign.goalAmount).toLocaleString()} goal
                </span>
              </div>
              <Progress value={percentComplete} />
            </div>
          </CardContent>
        </Card>

        {/* Donation Form */}
        <Card>
          <CardHeader>
            <CardTitle>Make a Donation</CardTitle>
            <CardDescription>Choose an amount or enter a custom amount</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!clientSecret ? (
              <>
                {/* Donor Information */}
                <div className="space-y-2">
                  <Label htmlFor="donor-info">Your Information</Label>
                  <Input
                    id="donor-name"
                    data-testid="input-donor-name"
                    placeholder="Full Name"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    required
                  />
                  <Input
                    id="donor-email"
                    data-testid="input-donor-email"
                    type="email"
                    placeholder="Email Address"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    required
                  />
                </div>

                {/* Gift Aid / Tax Relief Section (UK only) */}
                {taxReliefProgram && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="gift-aid-opt-in"
                        checked={giftAidOptIn}
                        onCheckedChange={(checked) => setGiftAidOptIn(checked as boolean)}
                        data-testid="checkbox-gift-aid"
                      />
                      <div className="flex-1">
                        <Label htmlFor="gift-aid-opt-in" className="text-sm font-medium leading-none cursor-pointer">
                          {taxReliefProgram.label}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {taxReliefProgram.description}
                          {taxReliefProgram.rate > 0 && (
                            <span className="font-medium"> (+{taxReliefProgram.rate}%)</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Show Gift Aid amount when selected */}
                    {giftAidOptIn && donationAmount > 0 && giftAidAmount > 0 && (
                      <div className="pl-7 pt-2">
                        <div className="rounded-md border bg-muted/30 p-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Gift Aid Amount:</span>
                            <span className="text-sm font-bold text-primary">
                              ${giftAidAmount.toFixed(2)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {giftAidPercentage}% of ${donationAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Show address fields if Gift Aid is checked */}
                    {giftAidOptIn && taxReliefProgram.requiresAddress && (
                      <div className="space-y-3 pl-7">
                        <div>
                          <Label htmlFor="donor-address" className="text-sm">Address</Label>
                          <Input
                            id="donor-address"
                            type="text"
                            placeholder="Street address"
                            value={donorAddress}
                            onChange={(e) => setDonorAddress(e.target.value)}
                            data-testid="input-donor-address"
                            className="mt-1"
                            required={giftAidOptIn}
                          />
                        </div>
                        <div>
                          <Label htmlFor="donor-town" className="text-sm">Town</Label>
                          <Input
                            id="donor-town"
                            type="text"
                            placeholder="Town"
                            value={donorTown}
                            onChange={(e) => setDonorTown(e.target.value)}
                            data-testid="input-donor-town"
                            className="mt-1"
                            required={giftAidOptIn}
                          />
                        </div>
                        <div>
                          <Label htmlFor="donor-state" className="text-sm">State / City</Label>
                          <Input
                            id="donor-state"
                            type="text"
                            placeholder="State or City"
                            value={donorState}
                            onChange={(e) => setDonorState(e.target.value)}
                            data-testid="input-donor-state"
                            className="mt-1"
                            required={giftAidOptIn}
                          />
                        </div>
                        <div>
                          <Label htmlFor="donor-postcode" className="text-sm">Postcode / Zip Code</Label>
                          <Input
                            id="donor-postcode"
                            type="text"
                            placeholder="Postcode or Zip Code"
                            value={donorPostcode}
                            onChange={(e) => setDonorPostcode(e.target.value)}
                            data-testid="input-donor-postcode"
                            className="mt-1"
                            required={giftAidOptIn}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Amount Selection */}
                <div className="space-y-2">
                  <Label>Select Amount</Label>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {SUGGESTED_AMOUNTS.map((amount) => (
                      <Button
                        key={amount}
                        variant={selectedAmount === amount ? "default" : "outline"}
                        onClick={() => handleAmountSelect(amount)}
                        data-testid={`button-amount-${amount}`}
                        disabled={createPaymentIntent.isPending}
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount */}
                <div className="space-y-2">
                  <Label htmlFor="custom-amount">Or Enter Custom Amount</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="custom-amount"
                        data-testid="input-custom-amount"
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="0.00"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="pl-6"
                      />
                    </div>
                    <Button
                      onClick={handleCustomAmount}
                      disabled={!customAmount || createPaymentIntent.isPending}
                      data-testid="button-custom-amount"
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Client Secret: {clientSecret ? "Received ✓" : "Not set"}
                </div>
                {clientSecret && stripePromise ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <DonationForm campaign={campaign} />
                  </Elements>
                ) : clientSecret ? (
                  <div className="flex flex-col items-center justify-center p-8 space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading payment form...</p>
                  </div>
                ) : (
                  <div className="text-sm text-destructive">
                    Error: Failed to initialize payment. Please try again.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
