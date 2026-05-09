import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Heart, TrendingUp, Info } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Campaign } from "@shared/schema";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getCurrencySymbol } from "@shared/location-constants";
import { getTaxReliefProgram } from "@shared/constants";

const donationSchema = z.object({
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Amount must be greater than 0",
  }),
  donorName: z.string().min(2, "Name is required"),
  donorEmail: z.string().email("Valid email is required"),
});

type DonationFormData = z.infer<typeof donationSchema>;

interface CampaignData extends Campaign {
  donorCount?: number;
  organization?: {
    country?: string;
    settings?: { giftAidPercentage?: number } | null;
  };
}

export default function CampaignWidgetPage() {
  const [, params] = useRoute("/widget/:campaignId");
  const [coverFees, setCoverFees] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  
  // Gift Aid / Tax Relief state
  const [giftAidOptIn, setGiftAidOptIn] = useState(false);
  const [donorAddress, setDonorAddress] = useState("");
  const [donorTown, setDonorTown] = useState("");
  const [donorState, setDonorState] = useState("");
  const [donorPostcode, setDonorPostcode] = useState("");

  const { data: campaign, isLoading } = useQuery<CampaignData>({
    queryKey: ["/api/campaigns/public", params?.campaignId],
    enabled: !!params?.campaignId,
  });

  const form = useForm<DonationFormData>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      amount: "",
      donorName: "",
      donorEmail: "",
    },
  });

  const donateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/campaigns/${params?.campaignId}/donate`, data);
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns/public", params?.campaignId] });
    },
  });

  if (isLoading || !campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentAmount = selectedAmount || parseFloat(customAmount) || 0;
  const totalAmount = coverFees 
    ? (currentAmount + 0.30) / (1 - 0.029)
    : currentAmount;
  const contributionFeeEstimate = totalAmount * 0.029 + 0.3;
  const netAmount = totalAmount - contributionFeeEstimate;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: campaign.currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const raised = parseFloat(campaign.currentAmount || "0");
  const goal = parseFloat(campaign.goalAmount);
  const progress = Math.min((raised / goal) * 100, 100);

  const suggestedAmounts = Array.isArray(campaign.quickDonationButtons)
    ? campaign.quickDonationButtons.map((btn: any) => ({
        amount: btn.amount,
        description: btn.description,
      }))
    : [
        { amount: 25 },
        { amount: 50 },
        { amount: 100 },
      ];

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
    form.setValue("amount", amount.toString());
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
    form.setValue("amount", value);
  };

  // Get tax relief program for UK organizations
  const isUK = campaign?.organization?.country === "GB";
  const taxReliefProgram = isUK ? getTaxReliefProgram("GB") : null;
  const giftAidPercentage = campaign?.organization?.settings?.giftAidPercentage || 25; // Default to 25%
  
  // Calculate Gift Aid amount (not added to total, just displayed)
  const giftAidAmount = giftAidOptIn && taxReliefProgram && currentAmount > 0
    ? (currentAmount * (giftAidPercentage / 100))
    : 0;

  const handleSubmit = (data: DonationFormData) => {
    donateMutation.mutate({
      ...data,
      recurring: false,
      coverFees,
      totalAmount,
      giftAidOptIn: taxReliefProgram ? giftAidOptIn : false,
      donorAddress: giftAidOptIn ? donorAddress : undefined,
      donorTown: giftAidOptIn ? donorTown : undefined,
      donorState: giftAidOptIn ? donorState : undefined,
      donorPostcode: giftAidOptIn ? donorPostcode : undefined,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
              <Heart className="h-8 w-8 text-green-600 dark:text-green-400" fill="currentColor" />
            </div>
            <h2 className="text-2xl font-bold">Thank you!</h2>
            <p className="text-muted-foreground">
              Your generous donation of {formatCurrency(currentAmount)} makes a real difference.
            </p>
            <Button 
              onClick={() => setSubmitted(false)}
              variant="outline"
              className="w-full"
              data-testid="button-donate-again"
            >
              Make another donation
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-3">
          <div className="space-y-2">
            <CardTitle className="text-lg">{campaign.title}</CardTitle>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">
                  {formatCurrency(raised)}
                </span>
                <span className="text-muted-foreground">
                  of {formatCurrency(goal)}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              {campaign.donorCount !== undefined && campaign.donorCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {campaign.donorCount.toLocaleString()} {campaign.donorCount === 1 ? "donor" : "donors"}
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Quick amounts */}
            <div className="grid grid-cols-3 gap-2">
              {suggestedAmounts.slice(0, 3).map((suggestion) => (
                <Button
                  key={suggestion.amount}
                  type="button"
                  variant={selectedAmount === suggestion.amount ? "default" : "outline"}
                  className="h-auto flex-col py-3 w-full overflow-hidden"
                  onClick={() => handleAmountSelect(suggestion.amount)}
                  size="sm"
                  data-testid={`button-amount-${suggestion.amount}`}
                >
                  <span className="font-bold whitespace-nowrap">
                    {formatCurrency(suggestion.amount)}
                  </span>
                  {suggestion.description && (
                    <span className="text-xs mt-1 opacity-80 line-clamp-2 text-center px-1 break-words max-w-full">
                      {suggestion.description}
                    </span>
                  )}
                </Button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="space-y-2">
              <Label htmlFor="customAmount" className="text-sm">Custom amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {getCurrencySymbol(campaign.currency || "USD")}
                </span>
                <Input
                  id="customAmount"
                  type="number"
                  placeholder="0"
                  className="pl-7 text-sm"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  data-testid="input-custom-amount"
                />
              </div>
            </div>

            {/* Cover fees */}
            {currentAmount > 0 && (
              <div className="rounded-md border p-3 space-y-2 bg-muted/30">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="coverFees"
                    checked={coverFees}
                    onCheckedChange={(checked) => setCoverFees(checked as boolean)}
                    data-testid="checkbox-cover-fees"
                  />
                  <div className="flex-1">
                    <Label htmlFor="coverFees" className="cursor-pointer text-sm font-medium flex items-center gap-1">
                      Cover fees
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">100% of your donation goes to the cause</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      +{formatCurrency(contributionFeeEstimate)}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                  <span>Total:</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-primary">
                  <TrendingUp className="h-3 w-3" />
                  <span>{formatCurrency(netAmount)} to campaign</span>
                </div>
              </div>
            )}

            {/* Donor info */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="donorName" className="text-sm">Name</Label>
                <Input
                  id="donorName"
                  {...form.register("donorName")}
                  placeholder="John Doe"
                  className="text-sm"
                  data-testid="input-donor-name"
                />
                {form.formState.errors.donorName && (
                  <p className="text-xs text-destructive">{form.formState.errors.donorName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="donorEmail" className="text-sm">Email</Label>
                <Input
                  id="donorEmail"
                  type="email"
                  {...form.register("donorEmail")}
                  placeholder="john@example.com"
                  className="text-sm"
                  data-testid="input-donor-email"
                />
                {form.formState.errors.donorEmail && (
                  <p className="text-xs text-destructive">{form.formState.errors.donorEmail.message}</p>
                )}
              </div>
            </div>

            {/* Gift Aid / Tax Relief Section (UK only) */}
            {taxReliefProgram && (
              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-start space-x-2">
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
                    <p className="text-xs text-muted-foreground mt-1">
                      {taxReliefProgram.description}
                      {taxReliefProgram.rate > 0 && (
                        <span className="font-medium"> (+{taxReliefProgram.rate}%)</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Show Gift Aid amount when selected */}
                {giftAidOptIn && currentAmount > 0 && giftAidAmount > 0 && (
                  <div className="pl-6 pt-2">
                    <div className="rounded-md border bg-muted/30 p-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium">Gift Aid Amount:</span>
                        <span className="text-xs font-bold text-primary">
                          {formatCurrency(giftAidAmount)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {giftAidPercentage}% of {formatCurrency(currentAmount)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Show address fields if Gift Aid is checked */}
                {giftAidOptIn && taxReliefProgram.requiresAddress && (
                  <div className="space-y-2 pl-6">
                    <div>
                      <Label htmlFor="donor-address" className="text-xs">Address</Label>
                      <Input
                        id="donor-address"
                        type="text"
                        placeholder="Street address"
                        value={donorAddress}
                        onChange={(e) => setDonorAddress(e.target.value)}
                        data-testid="input-donor-address"
                        className="mt-1 text-sm"
                        required={giftAidOptIn}
                      />
                    </div>
                    <div>
                      <Label htmlFor="donor-town" className="text-xs">Town</Label>
                      <Input
                        id="donor-town"
                        type="text"
                        placeholder="Town"
                        value={donorTown}
                        onChange={(e) => setDonorTown(e.target.value)}
                        data-testid="input-donor-town"
                        className="mt-1 text-sm"
                        required={giftAidOptIn}
                      />
                    </div>
                    <div>
                      <Label htmlFor="donor-state" className="text-xs">State / City</Label>
                      <Input
                        id="donor-state"
                        type="text"
                        placeholder="State or City"
                        value={donorState}
                        onChange={(e) => setDonorState(e.target.value)}
                        data-testid="input-donor-state"
                        className="mt-1 text-sm"
                        required={giftAidOptIn}
                      />
                    </div>
                    <div>
                      <Label htmlFor="donor-postcode" className="text-xs">Postcode / Zip Code</Label>
                      <Input
                        id="donor-postcode"
                        type="text"
                        placeholder="Postcode or Zip Code"
                        value={donorPostcode}
                        onChange={(e) => setDonorPostcode(e.target.value)}
                        data-testid="input-donor-postcode"
                        className="mt-1 text-sm"
                        required={giftAidOptIn}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={donateMutation.isPending || currentAmount <= 0}
              data-testid="button-donate-submit"
            >
              {donateMutation.isPending ? "Processing..." : `Donate ${formatCurrency(totalAmount)}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
