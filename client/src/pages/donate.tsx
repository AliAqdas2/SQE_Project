import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Campaign } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { getTaxReliefProgram } from "@shared/constants";
import { Checkbox } from "@/components/ui/checkbox";

const SUGGESTED_AMOUNTS = [25, 50, 100, 250, 500];

interface CampaignWithOrg extends Campaign {
  organization?: {
    country?: string;
    settings?: { giftAidPercentage?: number } | null;
  };
}

export default function DonatePage() {
  const [, params] = useRoute("/donate/:campaignId");
  const [, setLocation] = useLocation();
  const campaignId = params?.campaignId;
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");

  const [giftAidOptIn, setGiftAidOptIn] = useState(false);
  const [donorAddress, setDonorAddress] = useState("");
  const [donorTown, setDonorTown] = useState("");
  const [donorState, setDonorState] = useState("");
  const [donorPostcode, setDonorPostcode] = useState("");

  const { toast } = useToast();

  const { data: campaign, isLoading } = useQuery<CampaignWithOrg>({
    queryKey: ["/api/campaigns", campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}`);
      if (!res.ok) throw new Error("Campaign not found");
      return res.json();
    },
    enabled: !!campaignId,
  });

  const isUK = campaign?.organization?.country === "GB";
  const taxReliefProgram = isUK ? getTaxReliefProgram("GB") : null;
  const giftAidPercentage = campaign?.organization?.settings?.giftAidPercentage || 25;

  const donationAmount = selectedAmount || parseFloat(customAmount) || 0;
  const giftAidAmount =
    giftAidOptIn && taxReliefProgram && donationAmount > 0
      ? donationAmount * (giftAidPercentage / 100)
      : 0;

  const recordDonation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest("POST", `/api/campaigns/${campaignId}/donate`, {
        amount,
        totalAmount: amount,
        donorName,
        donorEmail,
        recurring: false,
        coverFees: false,
        giftAidOptIn: taxReliefProgram ? giftAidOptIn : false,
        donorAddress: giftAidOptIn ? donorAddress : undefined,
        donorTown: giftAidOptIn ? donorTown : undefined,
        donorState: giftAidOptIn ? donorState : undefined,
        donorPostcode: giftAidOptIn ? donorPostcode : undefined,
      });
      return res.json() as Promise<{ success: boolean; duplicate?: boolean }>;
    },
    onSuccess: (data) => {
      toast({
        title: data.duplicate ? "Already recorded" : "Thank you!",
        description: data.duplicate
          ? "This donation was already saved."
          : "Your donation has been recorded.",
      });
      setLocation(`/donation/success?offline=1&campaignId=${encodeURIComponent(campaignId || "")}`);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Could not record donation",
        description: error.message || "Something went wrong",
      });
    },
  });

  const submitAmount = (amount: number) => {
    if (!donorName || !donorEmail) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please enter your name and email first",
      });
      return;
    }
    if (giftAidOptIn && taxReliefProgram?.requiresAddress) {
      if (!donorAddress || !donorTown || !donorState || !donorPostcode) {
        toast({
          variant: "destructive",
          title: "Address required",
          description: "Please complete your address for Gift Aid.",
        });
        return;
      }
    }
    setSelectedAmount(amount);
    setCustomAmount("");
    recordDonation.mutate(amount);
  };

  const handleAmountSelect = (amount: number) => {
    submitAmount(amount);
  };

  const handleCustomAmount = () => {
    const amount = parseFloat(customAmount);
    if (!donorName || !donorEmail) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please enter your name and email first",
      });
      return;
    }
    if (amount && amount > 0) {
      submitAmount(amount);
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

        <Card>
          <CardHeader>
            <CardTitle>Make a Donation</CardTitle>
            <CardDescription>Choose an amount, then pay now — your gift is recorded right away.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="donor-info">Your information</Label>
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

                {giftAidOptIn && donationAmount > 0 && giftAidAmount > 0 && (
                  <div className="pl-7 pt-2">
                    <div className="rounded-md border bg-muted/30 p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Gift Aid amount:</span>
                        <span className="text-sm font-bold text-primary">${giftAidAmount.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {giftAidPercentage}% of ${donationAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                {giftAidOptIn && taxReliefProgram.requiresAddress && (
                  <div className="space-y-3 pl-7">
                    <div>
                      <Label htmlFor="donor-address" className="text-sm">
                        Address
                      </Label>
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
                      <Label htmlFor="donor-town" className="text-sm">
                        Town
                      </Label>
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
                      <Label htmlFor="donor-state" className="text-sm">
                        State / City
                      </Label>
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
                      <Label htmlFor="donor-postcode" className="text-sm">
                        Postcode / Zip Code
                      </Label>
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

            <div className="space-y-2">
              <Label>Select amount</Label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {SUGGESTED_AMOUNTS.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant={selectedAmount === amount ? "default" : "outline"}
                    onClick={() => handleAmountSelect(amount)}
                    data-testid={`button-amount-${amount}`}
                    disabled={recordDonation.isPending}
                  >
                    Pay ${amount}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-amount">Or enter a custom amount</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
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
                  type="button"
                  onClick={handleCustomAmount}
                  disabled={!customAmount || recordDonation.isPending}
                  data-testid="button-custom-amount"
                >
                  Pay now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
