import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit2, RefreshCw, CreditCard } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const countryPricingSchema = z.object({
  countryCode: z.string().min(2).max(3),
  tierCode: z.string(),
  monthlyPrice: z.string().min(1),
  yearlyPrice: z.string().min(1),
  currency: z.string().min(3).max(3),
  vatRate: z.string(),
});

type CountryPricing = {
  id: string;
  countryCode: string;
  tierCode: string;
  monthlyPrice: string;
  yearlyPrice: string;
  currency: string;
  vatRate: string;
};

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
  stripeProductId: string | null;
  stripeMonthlyPriceId: string | null;
  stripeYearlyPriceId: string | null;
};

const COMMON_COUNTRIES = [
  { code: "GB", name: "United Kingdom", currency: "GBP" },
  { code: "US", name: "United States", currency: "USD" },
  { code: "CA", name: "Canada", currency: "CAD" },
  { code: "AU", name: "Australia", currency: "AUD" },
  { code: "NZ", name: "New Zealand", currency: "NZD" },
  { code: "DE", name: "Germany", currency: "EUR" },
  { code: "FR", name: "France", currency: "EUR" },
  { code: "ES", name: "Spain", currency: "EUR" },
  { code: "IT", name: "Italy", currency: "EUR" },
  { code: "NL", name: "Netherlands", currency: "EUR" },
  { code: "AE", name: "United Arab Emirates", currency: "AED" },
];

export default function SubscriptionPricingPage() {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [editingPricing, setEditingPricing] = useState<CountryPricing | null>(null);
  const [showPricingDialog, setShowPricingDialog] = useState(false);

  const { data: plans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/admin/subscription-plans"],
  });

  const { data: countryPricing, isLoading: pricingLoading } = useQuery<CountryPricing[]>({
    queryKey: ["/api/admin/country-pricing"],
  });

  const initializeStripeMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/stripe/initialize-products-and-prices"),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Stripe products and prices initialized successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize Stripe products",
        variant: "destructive",
      });
    },
  });

  const form = useForm<z.infer<typeof countryPricingSchema>>({
    resolver: zodResolver(countryPricingSchema),
    defaultValues: {
      countryCode: "",
      tierCode: selectedPlan?.tierCode || "",
      monthlyPrice: "",
      yearlyPrice: "",
      currency: "GBP",
      vatRate: "0",
    },
  });

  const savePricingMutation = useMutation({
    mutationFn: (data: z.infer<typeof countryPricingSchema>) => {
      if (editingPricing) {
        return apiRequest("PATCH", `/api/admin/country-pricing/${editingPricing.id}`, data);
      }
      return apiRequest("POST", "/api/admin/country-pricing", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: editingPricing ? "Pricing updated successfully" : "Pricing created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/country-pricing"] });
      setShowPricingDialog(false);
      setEditingPricing(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save pricing",
        variant: "destructive",
      });
    },
  });

  const handleOpenPricingDialog = (plan: SubscriptionPlan, pricing?: CountryPricing) => {
    setSelectedPlan(plan);
    if (pricing) {
      setEditingPricing(pricing);
      form.reset({
        countryCode: pricing.countryCode,
        tierCode: pricing.tierCode,
        monthlyPrice: pricing.monthlyPrice,
        yearlyPrice: pricing.yearlyPrice,
        currency: pricing.currency,
        vatRate: pricing.vatRate,
      });
    } else {
      setEditingPricing(null);
      form.reset({
        countryCode: "",
        tierCode: plan.tierCode,
        monthlyPrice: plan.baseMonthlyPrice,
        yearlyPrice: plan.baseYearlyPrice,
        currency: "GBP",
        vatRate: "0",
      });
    }
    setShowPricingDialog(true);
  };

  const handleSubmit = (values: z.infer<typeof countryPricingSchema>) => {
    savePricingMutation.mutate(values);
  };

  const getPlanPricing = (tierCode: string) => {
    return countryPricing?.filter(p => p.tierCode === tierCode) || [];
  };

  if (plansLoading || pricingLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-subscription-pricing-title">
            Subscription Pricing
          </h1>
          <p className="text-muted-foreground">
            Manage subscription plans, country pricing, and Stripe integration
          </p>
        </div>
        <Button
          onClick={() => initializeStripeMutation.mutate()}
          disabled={initializeStripeMutation.isPending}
          data-testid="button-initialize-stripe"
        >
          {initializeStripeMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Initializing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Initialize Stripe
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6">
        {plans?.map((plan) => {
          const planPricing = getPlanPricing(plan.tierCode);
          return (
            <Card key={plan.id} data-testid={`card-plan-${plan.tierCode}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {plan.name}
                      <Badge variant="outline">{plan.tierCode}</Badge>
                    </CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenPricingDialog(plan)}
                    data-testid={`button-add-country-pricing-${plan.tierCode}`}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Country Pricing
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Base Monthly</div>
                    <div className="text-lg font-semibold">
                      {plan.currency} {parseFloat(plan.baseMonthlyPrice).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Base Yearly</div>
                    <div className="text-lg font-semibold">
                      {plan.currency} {parseFloat(plan.baseYearlyPrice).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Member Range</div>
                    <div className="text-lg font-semibold">
                      {plan.minMembers} - {plan.maxMembers || '∞'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Stripe Status</div>
                    <div>
                      {plan.stripeProductId ? (
                        <Badge variant="default">Connected</Badge>
                      ) : (
                        <Badge variant="secondary">Not Connected</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {planPricing.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Country Pricing</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Country</TableHead>
                          <TableHead>Currency</TableHead>
                          <TableHead>Monthly</TableHead>
                          <TableHead>Yearly</TableHead>
                          <TableHead>VAT Rate</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {planPricing.map((pricing) => {
                          const country = COMMON_COUNTRIES.find(c => c.code === pricing.countryCode);
                          return (
                            <TableRow key={pricing.id} data-testid={`row-pricing-${pricing.countryCode}-${plan.tierCode}`}>
                              <TableCell>{country?.name || pricing.countryCode}</TableCell>
                              <TableCell>{pricing.currency}</TableCell>
                              <TableCell>{parseFloat(pricing.monthlyPrice).toFixed(2)}</TableCell>
                              <TableCell>{parseFloat(pricing.yearlyPrice).toFixed(2)}</TableCell>
                              <TableCell>{parseFloat(pricing.vatRate).toFixed(1)}%</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenPricingDialog(plan, pricing)}
                                  data-testid={`button-edit-pricing-${pricing.countryCode}-${plan.tierCode}`}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={showPricingDialog} onOpenChange={setShowPricingDialog}>
        <DialogContent data-testid="dialog-country-pricing">
          <DialogHeader>
            <DialogTitle>
              {editingPricing ? "Edit" : "Add"} Country Pricing - {selectedPlan?.name}
            </DialogTitle>
            <DialogDescription>
              Configure pricing for a specific country and currency
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="countryCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!!editingPricing}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-country">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COMMON_COUNTRIES.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name} ({country.code})
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
                    <FormControl>
                      <Input {...field} placeholder="GBP" data-testid="input-currency" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="monthlyPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Price</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" data-testid="input-monthly-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="yearlyPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yearly Price</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" data-testid="input-yearly-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="vatRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VAT Rate (%)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.1" data-testid="input-vat-rate" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPricingDialog(false)}
                  data-testid="button-cancel-pricing"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savePricingMutation.isPending}
                  data-testid="button-save-pricing"
                >
                  {savePricingMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
