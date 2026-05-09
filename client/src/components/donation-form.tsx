import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Repeat, TrendingUp, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getDonationCategories, getTaxReliefProgram } from "@shared/constants";

const donationSchema = z.object({
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Amount must be greater than 0",
  }),
  donorName: z.string().min(2, "Name is required"),
  donorEmail: z.string().email("Valid email is required"),
  category: z.string().optional(),
  message: z.string().optional(),
});

type DonationFormData = z.infer<typeof donationSchema>;

interface DonationFormProps {
  campaignId: string;
  campaignTitle: string;
  suggestedAmounts?: { amount: number; description?: string }[];
  currency?: string;
  organizationReligion?: string; // christian, muslim, etc.
  organizationCountry?: string; // For Gift Aid check (e.g., "GB")
  organizationSettings?: { giftAidPercentage?: number } | null; // Gift Aid percentage from settings
  onSubmit: (data: DonationFormData & {
    recurring: boolean;
    frequency?: string;
    coverFees: boolean;
    totalAmount: number;
    giftAidOptIn?: boolean;
    donorAddress?: string;
    donorTown?: string;
    donorState?: string;
    donorPostcode?: string;
  }) => void;
  isLoading?: boolean;
}

export function DonationForm({
  campaignId,
  campaignTitle,
  suggestedAmounts = [
    { amount: 25, description: "Feeds one family" },
    { amount: 50, description: "Provides medical supplies" },
    { amount: 100, description: "Sponsors a child" },
  ],
  currency = "USD",
  organizationReligion,
  organizationCountry,
  organizationSettings,
  onSubmit,
  isLoading,
}: DonationFormProps) {
  const [donationType, setDonationType] = useState<"one-time" | "recurring">("one-time");
  const [frequency, setFrequency] = useState<string>("monthly");
  const [coverFees, setCoverFees] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(suggestedAmounts[0]?.amount || null);
  
  // Gift Aid / Tax Relief state
  const [giftAidOptIn, setGiftAidOptIn] = useState(false);
  const [donorAddress, setDonorAddress] = useState("");
  const [donorTown, setDonorTown] = useState("");
  const [donorState, setDonorState] = useState("");
  const [donorPostcode, setDonorPostcode] = useState("");
  
  // Get tax relief program for UK organizations
  const isUK = organizationCountry === "GB";
  const taxReliefProgram = isUK ? getTaxReliefProgram("GB") : null;
  const giftAidPercentage = organizationSettings?.giftAidPercentage || 25; // Default to 25%

  // Get donation categories based on organization religion from shared constants
  const donationCategories = getDonationCategories(organizationReligion);

  const form = useForm<DonationFormData>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      amount: suggestedAmounts[0]?.amount.toString() || "",
      donorName: "",
      donorEmail: "",
      category: donationCategories[0]?.value || "general",
      message: "",
    },
  });

  const currentAmount = selectedAmount || parseFloat(customAmount) || 0;
  
  // Stripe fee calculation: 2.9% + $0.30
  // When covering fees, we need to gross up the amount so that after Stripe takes their cut,
  // the campaign receives exactly the donor's intended amount
  const totalAmount = coverFees 
    ? (currentAmount + 0.30) / (1 - 0.029) // Gross up: (amount + fixed_fee) / (1 - percentage_fee)
    : currentAmount;
  
  const stripeFee = totalAmount * 0.029 + 0.30;
  const netAmount = totalAmount - stripeFee;
  
  // Calculate Gift Aid amount (not added to total, just displayed)
  const giftAidAmount = giftAidOptIn && taxReliefProgram && currentAmount > 0
    ? (currentAmount * (giftAidPercentage / 100))
    : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Get currency symbol for display
  const getCurrencySymbol = (currencyCode: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    // Extract symbol from formatted string (e.g., "$1" -> "$", "£1" -> "£")
    return formatter.format(1).replace(/\d/g, '').trim();
  };

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

  const handleSubmit = (data: DonationFormData) => {
    onSubmit({
      ...data,
      recurring: donationType === "recurring",
      frequency: donationType === "recurring" ? frequency : undefined,
      coverFees,
      totalAmount,
      giftAidOptIn: taxReliefProgram ? giftAidOptIn : false,
      donorAddress: giftAidOptIn ? donorAddress : undefined,
      donorTown: giftAidOptIn ? donorTown : undefined,
      donorState: giftAidOptIn ? donorState : undefined,
      donorPostcode: giftAidOptIn ? donorPostcode : undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Support {campaignTitle}</CardTitle>
        <CardDescription>
          Every contribution makes a difference
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* One-time vs Recurring */}
          <div className="space-y-3">
            <Label>Donation Type</Label>
            <RadioGroup 
              value={donationType} 
              onValueChange={(value) => setDonationType(value as "one-time" | "recurring")}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="one-time"
                  id="one-time"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="one-time"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover-elevate cursor-pointer peer-data-[state=checked]:border-primary"
                  data-testid="radio-one-time"
                >
                  <Heart className="mb-2 h-6 w-6" />
                  <span className="font-medium">One-time</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="recurring"
                  id="recurring"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="recurring"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover-elevate cursor-pointer peer-data-[state=checked]:border-primary"
                  data-testid="radio-recurring"
                >
                  <Repeat className="mb-2 h-6 w-6" />
                  <span className="font-medium">Monthly</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Frequency for recurring */}
          {donationType === "recurring" && (
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger data-testid="select-frequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Donation Category */}
          {donationCategories.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="category">Donation Category</Label>
              <Select 
                value={form.watch("category")} 
                onValueChange={(value) => form.setValue("category", value)}
              >
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {donationCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Suggested amounts */}
          <div className="space-y-3">
            <Label>Select Amount</Label>
            <TooltipProvider delayDuration={200}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {suggestedAmounts.map((suggestion) => (
                  <Tooltip key={suggestion.amount}>
                    <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={selectedAmount === suggestion.amount ? "default" : "outline"}
                        className="h-auto flex-col py-4 min-h-[80px] w-full overflow-hidden relative group"
                  onClick={() => handleAmountSelect(suggestion.amount)}
                  data-testid={`button-amount-${suggestion.amount}`}
                >
                  <span className="text-lg font-bold whitespace-nowrap">
                    {formatCurrency(suggestion.amount)}
                  </span>
                  {suggestion.description && (
                    <span className="text-xs mt-1 opacity-80 line-clamp-2 text-center px-1 break-words max-w-full">
                      {suggestion.description}
                    </span>
                  )}
                </Button>
                    </TooltipTrigger>
                    {suggestion.description && (
                      <TooltipContent 
                        side="top" 
                        className="max-w-xs p-3 bg-popover border shadow-lg animate-in fade-in-0 zoom-in-95 duration-200 z-50"
                      >
                        <p className="text-sm font-medium">{formatCurrency(suggestion.amount)}</p>
                        <p className="text-xs text-muted-foreground mt-1 whitespace-normal">
                          {suggestion.description}
                        </p>
                      </TooltipContent>
                    )}
                  </Tooltip>
              ))}
            </div>
            </TooltipProvider>
          </div>

          {/* Custom amount */}
          <div className="space-y-2">
            <Label htmlFor="customAmount">Or enter custom amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {getCurrencySymbol(currency)}
              </span>
              <Input
                id="customAmount"
                type="number"
                placeholder="0.00"
                className="pl-8"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                data-testid="input-custom-amount"
              />
            </div>
          </div>

          {/* Cover fees option */}
          <div className="rounded-lg border p-4 space-y-3 bg-muted/50">
            <div className="flex items-start gap-3">
              <Checkbox
                id="coverFees"
                checked={coverFees}
                onCheckedChange={(checked) => setCoverFees(checked as boolean)}
                data-testid="checkbox-cover-fees"
              />
              <div className="flex-1">
                <Label htmlFor="coverFees" className="cursor-pointer font-medium flex items-center gap-2">
                  Cover processing fees
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>By covering fees, 100% of your donation goes to the cause</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Add {formatCurrency(stripeFee)} to cover processing fees
                </p>
              </div>
            </div>

            {currentAmount > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span>Your donation:</span>
                  <span className="font-medium">{formatCurrency(currentAmount)}</span>
                </div>
                {coverFees && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Processing fee:</span>
                    <span>{formatCurrency(stripeFee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total charge:</span>
                  <span data-testid="text-total-amount">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-primary">
                  <TrendingUp className="h-4 w-4" />
                  <span>{formatCurrency(netAmount)} goes to the campaign</span>
                </div>
              </div>
            )}
          </div>

          {/* Donor information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="donorName">Full Name</Label>
              <Input
                id="donorName"
                {...form.register("donorName")}
                placeholder="John Doe"
                data-testid="input-donor-name"
              />
              {form.formState.errors.donorName && (
                <p className="text-sm text-destructive">{form.formState.errors.donorName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="donorEmail">Email Address</Label>
              <Input
                id="donorEmail"
                type="email"
                {...form.register("donorEmail")}
                placeholder="john@example.com"
                data-testid="input-donor-email"
              />
              {form.formState.errors.donorEmail && (
                <p className="text-sm text-destructive">{form.formState.errors.donorEmail.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                {...form.register("message")}
                placeholder="Leave a message of support..."
                rows={3}
                data-testid="textarea-message"
              />
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
              {giftAidOptIn && currentAmount > 0 && giftAidAmount > 0 && (
                <div className="pl-7 pt-2">
                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Gift Aid Amount:</span>
                      <span className="text-sm font-bold text-primary">
                        {formatCurrency(giftAidAmount)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {giftAidPercentage}% of {formatCurrency(currentAmount)}
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

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading || currentAmount <= 0}
            data-testid="button-donate-submit"
          >
            {isLoading ? (
              "Processing..."
            ) : donationType === "recurring" ? (
              `Donate ${formatCurrency(totalAmount)} ${frequency}`
            ) : (
              `Donate ${formatCurrency(totalAmount)}`
            )}
          </Button>

          {donationType === "recurring" && (
            <p className="text-xs text-center text-muted-foreground">
              You can cancel your recurring donation at any time from your account
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
