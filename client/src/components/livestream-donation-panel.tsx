import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Coins, Heart, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { getDonationCategories, getTaxReliefProgram } from "@shared/constants";
import { STRIPE_PUBLISHABLE_KEY } from "@/lib/Constants";

const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

interface DonationPanelProps {
  livestreamId: string;
  currency: string;
  organizationReligion?: string | null;
  organizationCountry?: string | null;
  organizationSettings?: { giftAidPercentage?: number } | null;
  recentDonations: Array<{
    donorName: string;
    amount: string;
    message: string;
    createdAt: string;
  }>;
}

export function LivestreamDonationPanel({ 
  livestreamId, 
  currency, 
  organizationReligion,
  organizationCountry,
  organizationSettings,
  recentDonations 
}: DonationPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check if Stripe is available
  if (!stripePromise) {
    console.error("Stripe publishable key is not configured");
  }
  const [showForm, setShowForm] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [showName, setShowName] = useState(true);
  const [showAmount, setShowAmount] = useState(true);
  
  // Gift Aid / Tax Relief state
  const [giftAidOptIn, setGiftAidOptIn] = useState(false);
  const [donorAddress, setDonorAddress] = useState("");
  const [donorTown, setDonorTown] = useState("");
  const [donorState, setDonorState] = useState("");
  const [donorPostcode, setDonorPostcode] = useState("");
  
  // Get donation categories based on organization religion
  const donationCategories = getDonationCategories(organizationReligion);
  const [category, setCategory] = useState(donationCategories[0]?.value || "general");
  
  // Get tax relief program for UK organizations
  const isUK = organizationCountry === "GB";
  const taxReliefProgram = isUK ? getTaxReliefProgram("GB") : null;
  
  // Calculate Gift Aid amount (not added to total, just displayed)
  const donationAmount = parseFloat(amount) || 0;
  const giftAidPercentage = organizationSettings?.giftAidPercentage || 25; // Default to 25%
  const giftAidAmount = giftAidOptIn && taxReliefProgram && donationAmount > 0
    ? (donationAmount * (giftAidPercentage / 100))
    : 0;

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const createPaymentIntent = useMutation({
    mutationFn: async (data: {
      amount: number;
      donorName: string;
      donorEmail: string;
      giftAidOptIn?: boolean;
      donorAddress?: string;
      donorTown?: string;
      donorState?: string;
      donorPostcode?: string;
      category?: string;
      message?: string;
    }) => {
      const res = await apiRequest("POST", "/api/create-payment-intent", {
        amount: data.amount,
        livestreamId,
        donorName: data.donorName,
        donorEmail: data.donorEmail,
        giftAidOptIn: data.giftAidOptIn || false,
        donorAddress: data.donorAddress,
        donorTown: data.donorTown,
        donorState: data.donorState,
        donorPostcode: data.donorPostcode,
        category: data.category,
        message: data.message,
      });
      return await res.json();
    },
    onSuccess: (data: any) => {
      console.log("Payment intent created:", data);
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setShowPaymentForm(true);
        toast({
          title: "Payment Initialized",
          description: "Please enter your payment information",
        });
      } else {
        console.error("No clientSecret in response:", data);
        toast({
          title: "Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!donorName || !donorEmail || !amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid donation amount",
        variant: "destructive",
      });
      return;
    }

    // Create payment intent instead of directly donating
    createPaymentIntent.mutate({
      amount: amountNum,
      donorName,
      donorEmail,
      giftAidOptIn: taxReliefProgram ? giftAidOptIn : false,
      donorAddress: giftAidOptIn ? donorAddress : undefined,
      donorTown: giftAidOptIn ? donorTown : undefined,
      donorState: giftAidOptIn ? donorState : undefined,
      donorPostcode: giftAidOptIn ? donorPostcode : undefined,
      category,
      message,
    });
  };

  // Payment Form Component (nested inside main component)
  function PaymentForm() {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePaymentSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!stripe || !elements) {
        return;
      }

      setIsProcessing(true);

      try {
        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/donation/success`,
          },
          redirect: "if_required",
        });

        if (error) {
          toast({
            variant: "destructive",
            title: "Payment failed",
            description: error.message,
          });
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
          // Payment succeeded - now confirm donation on backend
          try {
            const response = await fetch(`/api/livestreams/${livestreamId}/confirm-donation`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || 'Failed to confirm donation');
            }

            toast({
              title: "Donation Received!",
              description: "Thank you for your generous support!",
            });
            
            // Reset form
            setDonorName("");
            setDonorEmail("");
            setAmount("");
            setMessage("");
            setCategory(donationCategories[0]?.value || "general");
            setGiftAidOptIn(false);
            setDonorAddress("");
            setDonorTown("");
            setDonorState("");
            setDonorPostcode("");
            setShowForm(false);
            setShowPaymentForm(false);
            setClientSecret(null);
            
            // Refresh livestream data
            queryClient.invalidateQueries({ queryKey: [`/api/livestreams/public/${livestreamId}`] });
          } catch (confirmError: any) {
            console.error('Donation confirmation error:', confirmError);
            toast({
              variant: "destructive",
              title: "Payment succeeded but failed to record donation",
              description: "Please contact support.",
            });
          }
        }
      } catch (err: any) {
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
      <form onSubmit={handlePaymentSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Payment Information</Label>
          <PaymentElement />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={!stripe || isProcessing}
          data-testid="button-submit-payment"
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

  const quickAmounts = [25, 50, 100, 250];

  return (
    <div className="space-y-6">
      {/* Donation CTA */}
      {!showForm && !showPaymentForm && (
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Support This Livestream
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Your donation helps make this possible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full bg-background text-foreground hover:bg-background/90"
              size="lg"
              onClick={() => setShowForm(true)}
              data-testid="button-show-donation-form"
            >
              <Coins className="h-5 w-5 mr-2" />
              Donate Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Donation Form - Hidden when Stripe payment form is shown */}
      {showForm && !showPaymentForm && (
        <Card>
          <CardHeader>
            <CardTitle>Make a Donation</CardTitle>
            <CardDescription>
              Support this livestream with your contribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Quick Amount Buttons */}
              <div>
                <Label>Quick Amount</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {quickAmounts.map((quickAmount) => (
                    <Button
                      key={quickAmount}
                      type="button"
                      variant={amount === quickAmount.toString() ? "default" : "outline"}
                      onClick={() => setAmount(quickAmount.toString())}
                      disabled={showPaymentForm}
                      data-testid={`button-quick-amount-${quickAmount}`}
                    >
                      {currency} {quickAmount}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <Label htmlFor="amount">Amount ({currency})</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="Enter custom amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={showPaymentForm}
                  data-testid="input-donation-amount"
                  required
                />
              </div>

              {/* Donation Category */}
              {donationCategories.length > 1 && (
                <div>
                  <Label htmlFor="category">Donation Category</Label>
                  <Select value={category} onValueChange={setCategory} disabled={showPaymentForm}>
                    <SelectTrigger data-testid="select-donation-category">
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
              )}

              {/* Donor Name */}
              <div>
                <Label htmlFor="donorName">Your Name</Label>
                <Input
                  id="donorName"
                  type="text"
                  placeholder="John Doe"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  disabled={showPaymentForm}
                  data-testid="input-donor-name"
                  required
                />
              </div>

              {/* Donor Email */}
              <div>
                <Label htmlFor="donorEmail">Email Address</Label>
                <Input
                  id="donorEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  disabled={showPaymentForm}
                  data-testid="input-donor-email"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Share your thoughts..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={showPaymentForm}
                  data-testid="input-donation-message"
                  rows={3}
                />
              </div>

              {/* Privacy Options */}
              <div className="space-y-2 p-4 rounded-lg border bg-muted/50">
                <p className="text-sm font-medium">Privacy Settings</p>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showName"
                    checked={showName}
                    onCheckedChange={(checked) => setShowName(checked as boolean)}
                    data-testid="checkbox-show-name"
                  />
                  <Label htmlFor="showName" className="text-sm font-normal cursor-pointer">
                    Show my name publicly
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showAmount"
                    checked={showAmount}
                    onCheckedChange={(checked) => setShowAmount(checked as boolean)}
                    data-testid="checkbox-show-amount"
                  />
                  <Label htmlFor="showAmount" className="text-sm font-normal cursor-pointer">
                    Show donation amount publicly
                  </Label>
                </div>
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
                            {currency} {giftAidAmount.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {giftAidPercentage}% of {currency} {donationAmount.toFixed(2)}
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

              {/* Submit Buttons */}
              {!showPaymentForm ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowForm(false);
                      setClientSecret(null);
                      setShowPaymentForm(false);
                    }}
                    disabled={createPaymentIntent.isPending}
                    data-testid="button-cancel-donation"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createPaymentIntent.isPending}
                    data-testid="button-submit-donation"
                  >
                    {createPaymentIntent.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Heart className="h-4 w-4 mr-2" />
                        Continue to Payment
                      </>
                    )}
                  </Button>
                </div>
              ) : null}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stripe Payment Form - Replaces donation form when shown */}
      {showPaymentForm && clientSecret ? (
        stripePromise ? (
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>
                Complete your donation securely
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm />
              </Elements>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>
                Loading payment form...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-8 space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Initializing payment...</p>
              </div>
            </CardContent>
          </Card>
        )
      ) : showPaymentForm && !clientSecret ? (
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-destructive">
              Error: Failed to initialize payment. Please try again.
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => {
                setShowPaymentForm(false);
                setClientSecret(null);
              }}
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Recent Donations Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Donations</CardTitle>
          <CardDescription>
            Latest contributions from our supporters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentDonations.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  No donations yet. Be the first to give!
                </p>
              </div>
            ) : (
              recentDonations.map((donation, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border bg-card hover-elevate"
                  data-testid={`donation-item-${index}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium" data-testid={`donation-name-${index}`}>
                      {donation.donorName}
                    </span>
                    {donation.amount !== "0" && (
                      <span className="font-bold text-primary" data-testid={`donation-amount-${index}`}>
                        {currency} {parseFloat(donation.amount).toFixed(2)}
                      </span>
                    )}
                  </div>
                  {donation.message && (
                    <p className="text-sm text-muted-foreground mb-1" data-testid={`donation-message-${index}`}>
                      "{donation.message}"
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(donation.createdAt), "p")}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
