import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Edit, Coins, Loader2, Package } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { insertMarketplaceModuleSchema, insertModulePricingSchema } from "@shared/schema";

interface MarketplaceModule {
  id: string;
  moduleKey: string;
  title: string;
  description: string;
  imageUrl: string | null;
  isDefault: boolean;
  isActive: boolean;
}

interface ModulePricing {
  id: string;
  moduleId: string;
  country: string;
  currency: string;
  price: string;
  billingPeriod: string;
}

const COUNTRIES = [
  { code: "US", name: "United States", currency: "USD" },
  { code: "GB", name: "United Kingdom", currency: "GBP" },
  { code: "AE", name: "United Arab Emirates", currency: "AED" },
  { code: "ZA", name: "South Africa", currency: "ZAR" },
];

const MODULE_KEYS = [
  "fundraising",
  "donors",
  "events",
  "livestream",
  "analytics",
  "qr_donations",
] as const;

// Form schemas
const moduleFormSchema = insertMarketplaceModuleSchema.extend({
  imageUrl: z.string().url().optional().or(z.literal("")),
});

const pricingFormSchema = insertModulePricingSchema.extend({
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid price"),
});

type ModuleFormValues = z.infer<typeof moduleFormSchema>;
type PricingFormValues = z.infer<typeof pricingFormSchema>;

export default function AdminMarketplacePage() {
  const { toast } = useToast();
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [selectedModule, setSelectedModule] = useState<MarketplaceModule | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const moduleForm = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleFormSchema),
    defaultValues: {
      moduleKey: "fundraising",
      title: "",
      description: "",
      imageUrl: "",
      isDefault: false,
      isActive: true,
    },
  });

  const pricingForm = useForm<PricingFormValues>({
    resolver: zodResolver(pricingFormSchema),
    defaultValues: {
      moduleId: "",
      country: "US",
      currency: "USD",
      price: "0.00",
      billingPeriod: "monthly",
    },
  });

  const { data: modules, isLoading: modulesLoading } = useQuery<MarketplaceModule[]>({
    queryKey: ["/api/admin/marketplace/modules"],
  });

  const { data: selectedModulePricing, isLoading: pricingLoading } = useQuery<ModulePricing[]>({
    queryKey: ["/api/admin/marketplace/pricing", selectedModule?.id],
    enabled: !!selectedModule,
    staleTime: 0,
    refetchOnMount: true,
  });

  const createModuleMutation = useMutation({
    mutationFn: async (data: ModuleFormValues) => {
      const response = await apiRequest("POST", "/api/admin/marketplace/modules", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketplace/modules"] });
      toast({
        title: "Module created",
        description: "The marketplace module has been created successfully.",
      });
      setShowModuleDialog(false);
      moduleForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Creation failed",
        description: error.message || "Failed to create module",
        variant: "destructive",
      });
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ModuleFormValues> }) => {
      const response = await apiRequest("PATCH", `/api/admin/marketplace/modules/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketplace/modules"] });
      toast({
        title: "Module updated",
        description: "The marketplace module has been updated successfully.",
      });
      setShowModuleDialog(false);
      moduleForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update module",
        variant: "destructive",
      });
    },
  });

  const createPricingMutation = useMutation({
    mutationFn: async (data: PricingFormValues) => {
      const response = await apiRequest(
        "POST",
        `/api/admin/marketplace/pricing`,
        data
      );
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ 
        queryKey: ["/api/admin/marketplace/pricing", selectedModule?.id] 
      });
      await queryClient.refetchQueries({
        queryKey: ["/api/admin/marketplace/pricing", selectedModule?.id]
      });
      toast({
        title: "Pricing created",
        description: "The pricing has been created successfully.",
      });
      pricingForm.reset({
        moduleId: selectedModule?.id || "",
        country: "US",
        currency: "USD",
        price: "0.00",
        billingPeriod: "monthly",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation failed",
        description: error.message || "Failed to create pricing",
        variant: "destructive",
      });
    },
  });

  const deletePricingMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/marketplace/pricing/${id}`);
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ 
        queryKey: ["/api/admin/marketplace/pricing", selectedModule?.id] 
      });
      await queryClient.refetchQueries({
        queryKey: ["/api/admin/marketplace/pricing", selectedModule?.id]
      });
      toast({
        title: "Pricing deleted",
        description: "The pricing has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion failed",
        description: error.message || "Failed to delete pricing",
        variant: "destructive",
      });
    },
  });

  const handleCreateModule = () => {
    setIsEditMode(false);
    moduleForm.reset({
      moduleKey: "fundraising",
      title: "",
      description: "",
      imageUrl: "",
      isDefault: false,
      isActive: true,
    });
    setShowModuleDialog(true);
  };

  const handleEditModule = (module: MarketplaceModule) => {
    setIsEditMode(true);
    setSelectedModule(module);
    moduleForm.reset({
      moduleKey: module.moduleKey as any,
      title: module.title,
      description: module.description,
      imageUrl: module.imageUrl || "",
      isDefault: module.isDefault,
      isActive: module.isActive,
    });
    setShowModuleDialog(true);
  };

  const handleManagePricing = (module: MarketplaceModule) => {
    setSelectedModule(module);
    pricingForm.reset({
      moduleId: module.id,
      country: "US",
      currency: "USD",
      price: "0.00",
      billingPeriod: "monthly",
    });
    setShowPricingDialog(true);
  };

  const onModuleSubmit = (data: ModuleFormValues) => {
    if (isEditMode && selectedModule) {
      updateModuleMutation.mutate({ id: selectedModule.id, data });
    } else {
      createModuleMutation.mutate(data);
    }
  };

  const onPricingSubmit = (data: PricingFormValues) => {
    createPricingMutation.mutate(data);
  };

  const handleCountryChange = (country: string) => {
    const countryData = COUNTRIES.find(c => c.code === country);
    if (countryData) {
      pricingForm.setValue("country", country);
      pricingForm.setValue("currency", countryData.currency);
    }
  };

  const handleDeletePricing = (id: string) => {
    if (confirm("Are you sure you want to delete this pricing?")) {
      deletePricingMutation.mutate(id);
    }
  };

  if (modulesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl" data-testid="text-marketplace-title">
                Marketplace Management
              </CardTitle>
              <CardDescription>
                Manage marketplace modules and pricing across different countries
              </CardDescription>
            </div>
            <Button onClick={handleCreateModule} data-testid="button-create-module">
              <Plus className="w-4 h-4 mr-2" />
              Create Module
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules && modules.length > 0 ? (
                modules.map((module) => (
                  <TableRow key={module.id} data-testid={`row-module-${module.id}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium" data-testid={`text-module-title-${module.id}`}>
                          {module.title}
                        </div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {module.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded" data-testid={`text-module-key-${module.id}`}>
                        {module.moduleKey}
                      </code>
                    </TableCell>
                    <TableCell>
                      {module.isActive ? (
                        <Badge className="bg-green-600 hover:bg-green-700" data-testid={`status-active-${module.id}`}>
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" data-testid={`status-inactive-${module.id}`}>
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {module.isDefault ? (
                        <Badge variant="outline" data-testid={`type-default-${module.id}`}>
                          <Package className="w-3 h-3 mr-1" />
                          Default
                        </Badge>
                      ) : (
                        <Badge variant="secondary" data-testid={`type-marketplace-${module.id}`}>
                          Marketplace
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditModule(module)}
                          data-testid={`button-edit-${module.id}`}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        {!module.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleManagePricing(module)}
                            data-testid={`button-pricing-${module.id}`}
                          >
                            <Coins className="w-4 h-4 mr-1" />
                            Pricing
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No modules found. Create your first marketplace module.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Module Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle data-testid="text-module-dialog-title">
              {isEditMode ? "Edit Module" : "Create Module"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? "Update the module details" : "Add a new module to the marketplace"}
            </DialogDescription>
          </DialogHeader>
          <Form {...moduleForm}>
            <form onSubmit={moduleForm.handleSubmit(onModuleSubmit)} className="space-y-4 py-4">
              <FormField
                control={moduleForm.control}
                name="moduleKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module Key</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isEditMode}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-module-key">
                          <SelectValue placeholder="Select module key" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MODULE_KEYS.map((key) => (
                          <SelectItem key={key} value={key}>
                            {key}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={moduleForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-module-title"
                        placeholder="e.g., Event Management"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={moduleForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        data-testid="textarea-module-description"
                        placeholder="Describe what this module does..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={moduleForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (optional)</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-module-image"
                        placeholder="https://example.com/image.png"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={moduleForm.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Default Module</FormLabel>
                      <FormDescription>
                        Enabled for all new organizations automatically
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        data-testid="switch-is-default"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isEditMode}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={moduleForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Visible in the marketplace
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        data-testid="switch-is-active"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowModuleDialog(false);
                    moduleForm.reset();
                  }}
                  data-testid="button-cancel-module"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createModuleMutation.isPending || updateModuleMutation.isPending}
                  data-testid="button-save-module"
                >
                  {(createModuleMutation.isPending || updateModuleMutation.isPending) ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    isEditMode ? "Update" : "Create"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Pricing Dialog */}
      <Dialog open={showPricingDialog} onOpenChange={setShowPricingDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle data-testid="text-pricing-dialog-title">
              Manage Pricing: {selectedModule?.title}
            </DialogTitle>
            <DialogDescription>
              Configure pricing for different countries and currencies
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Existing Pricing */}
            <div>
              <h3 className="font-medium mb-3">Current Pricing</h3>
              {pricingLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin" data-testid="loader-pricing" />
                </div>
              ) : selectedModulePricing && selectedModulePricing.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Country</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Billing Period</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedModulePricing.map((pricing) => {
                      const country = COUNTRIES.find(c => c.code === pricing.country);
                      return (
                        <TableRow key={pricing.id} data-testid={`row-pricing-${pricing.id}`}>
                          <TableCell data-testid={`text-country-${pricing.id}`}>
                            {country?.name || pricing.country}
                          </TableCell>
                          <TableCell data-testid={`text-currency-${pricing.id}`}>
                            {pricing.currency}
                          </TableCell>
                          <TableCell data-testid={`text-price-${pricing.id}`}>
                            {pricing.currency} {parseFloat(pricing.price).toFixed(2)}
                          </TableCell>
                          <TableCell data-testid={`text-billing-${pricing.id}`}>
                            {pricing.billingPeriod}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePricing(pricing.id)}
                              data-testid={`button-delete-pricing-${pricing.id}`}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No pricing configured yet.</p>
              )}
            </div>

            {/* Add New Pricing */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Add New Pricing</h3>
              <Form {...pricingForm}>
                <form onSubmit={pricingForm.handleSubmit(onPricingSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={pricingForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleCountryChange(value);
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-pricing-country">
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {COUNTRIES.map((country) => (
                                <SelectItem key={country.code} value={country.code}>
                                  {country.name} ({country.currency})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={pricingForm.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-pricing-currency"
                              {...field}
                              disabled
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={pricingForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price</FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-price"
                              type="number"
                              step="0.01"
                              placeholder="9.99"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={pricingForm.control}
                      name="billingPeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Billing Period</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-billing-period">
                                <SelectValue placeholder="Select billing period" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                              <SelectItem value="one_time">One-time</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={createPricingMutation.isPending}
                    data-testid="button-add-pricing"
                  >
                    {createPricingMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Pricing
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPricingDialog(false);
                setSelectedModule(null);
                pricingForm.reset();
              }}
              data-testid="button-close-pricing"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
