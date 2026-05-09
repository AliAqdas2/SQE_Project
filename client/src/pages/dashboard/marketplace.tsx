import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Check, 
  Loader2, 
  Package, 
  Calendar, 
  Video, 
  BarChart3, 
  QrCode,
  Users,
  Sparkles,
  BookOpen,
  Heart,
  Clock,
  MessageSquare,
  Contact,
  HandHeart,
  Target,
  Mail,
  Lock,
  ArrowUpRight,
  Crown
} from "lucide-react";

interface MarketplaceModule {
  id: string;
  moduleKey: string;
  title: string;
  description: string;
  imageUrl: string | null;
  isDefault: boolean;
  isActive: boolean;
}

interface EnabledModule {
  id: string;
  orgId: string;
  moduleId: string;
  enabledAt: string;
  status: string;
  module: {
    id: string;
    moduleKey: string;
    title: string;
    description: string;
    isDefault: boolean;
  };
}

interface SubscriptionInfo {
  subscription: {
    id: string;
    planId: string;
    status: string;
  };
  plan: {
    id: string;
    tierCode: string;
    name: string;
  };
}

const enableModuleSchema = z.object({
  moduleId: z.string().min(1, "Module ID is required"),
  confirmed: z.boolean().refine((val) => val === true, {
    message: "You must confirm to enable the module",
  }),
});

type EnableModuleFormValues = z.infer<typeof enableModuleSchema>;

export default function MarketplacePage() {
  const { toast } = useToast();
  const [selectedModule, setSelectedModule] = useState<MarketplaceModule | null>(null);
  const [showEnableDialog, setShowEnableDialog] = useState(false);

  const enableForm = useForm<EnableModuleFormValues>({
    resolver: zodResolver(enableModuleSchema),
    defaultValues: {
      moduleId: "",
      confirmed: false,
    },
  });

  const { data: session } = useQuery<{ user: { orgId: string } }>({
    queryKey: ["/api/auth/session"],
  });

  const orgId = session?.user?.orgId;

  const { data: subscriptionInfo, isLoading: subscriptionLoading } = useQuery<SubscriptionInfo>({
    queryKey: ["/api/org", orgId, "subscription"],
    enabled: !!orgId,
  });

  // If no subscription info, treat as no plan (should show upgrade message)
  // If subscription exists, check if it's free tier
  const hasNoPlan = !subscriptionInfo || !subscriptionInfo.plan;
  const isFreePlan = hasNoPlan || subscriptionInfo?.plan?.tierCode?.toLowerCase() === "free";

  const { data: availableModules, isLoading: modulesLoading } = useQuery<MarketplaceModule[]>({
    queryKey: ["/api/marketplace/modules"],
    enabled: !!orgId,
  });

  const { data: enabledModules, isLoading: enabledLoading } = useQuery<EnabledModule[]>({
    queryKey: [`/api/org/${orgId}/modules`],
    enabled: !!orgId,
  });

  const enableModuleMutation = useMutation({
    mutationFn: async ({ moduleId }: { moduleId: string }) => {
      if (!orgId) throw new Error("Organization ID not found");
      const response = await apiRequest("POST", `/api/org/${orgId}/modules`, { 
        moduleId 
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Failed to enable module");
      }
      return await response.json();
    },
    onSuccess: async () => {
      setShowEnableDialog(false);
      setSelectedModule(null);
      enableForm.reset();
      
      toast({
        title: "Module enabled",
        description: "The module has been enabled and is now available to use.",
      });
      
      await queryClient.invalidateQueries({ 
        queryKey: [`/api/org/${orgId}/modules`],
        refetchType: 'active'
      });
      await queryClient.invalidateQueries({ 
        queryKey: ["/api/marketplace/modules"],
        refetchType: 'active'
      });
    },
    onError: (error: any) => {
      toast({
        title: "Enable failed",
        description: error.message || "Failed to enable module",
        variant: "destructive",
      });
    },
  });

  const disableModuleMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      if (!orgId) throw new Error("Organization ID not found");
      await apiRequest("DELETE", `/api/org/${orgId}/modules/${moduleId}`);
    },
    onSuccess: async () => {
      toast({
        title: "Module disabled",
        description: "The module has been disabled successfully.",
      });
      
      await queryClient.invalidateQueries({ 
        queryKey: [`/api/org/${orgId}/modules`],
        refetchType: 'active'
      });
      await queryClient.invalidateQueries({ 
        queryKey: ["/api/marketplace/modules"],
        refetchType: 'active'
      });
    },
    onError: (error: any) => {
      toast({
        title: "Disable failed",
        description: error.message || "Failed to disable module",
        variant: "destructive",
      });
    },
  });

  const isModuleEnabled = (moduleId: string) => {
    return enabledModules?.some((em) => em.moduleId === moduleId);
  };

  const handleEnableModule = (moduleId: string) => {
    const module = availableModules?.find(m => m.id === moduleId);
    if (!module) return;
    
    setSelectedModule(module);
    enableForm.reset({
      moduleId: module.id,
      confirmed: false,
    });
    setShowEnableDialog(true);
  };

  const onEnableSubmit = (data: EnableModuleFormValues) => {
    if (data.confirmed) {
      enableModuleMutation.mutate({ moduleId: data.moduleId });
    }
  };

  const getModuleIcon = (moduleKey: string) => {
    switch (moduleKey) {
      case "events":
        return Calendar;
      case "livestream":
        return Video;
      case "analytics":
        return BarChart3;
      case "qr_donations":
        return QrCode;
      case "volunteer_management":
        return Users;
      case "activities":
        return Calendar;
      case "sermon_library":
        return BookOpen;
      case "beneficiaries":
        return Heart;
      case "prayer_timetable":
        return Clock;
      case "ai_chatbot":
        return MessageSquare;
      case "contacts":
        return Contact;
      case "donors":
        return Users;
      case "fundraising":
        return Target;
      case "prayer_wall":
        return HandHeart;
      case "email_builder":
        return Mail;
      default:
        return Package;
    }
  };

  if (modulesLoading || enabledLoading || subscriptionLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <div className="space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div>
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="flex flex-col">
                  <CardHeader>
                    <Skeleton className="w-16 h-16 rounded-md mb-4" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </CardHeader>
                  <CardContent className="pt-0 mt-auto">
                    <Skeleton className="h-12 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const enabledMarketplaceModules = availableModules?.map((m) => {
    const orgModule = enabledModules?.find((em) => em.moduleId === m.id);
    return orgModule ? { 
      ...m, 
      orgModuleId: orgModule.id,
      enabledAt: orgModule.enabledAt
    } : null;
  }).filter(Boolean) || [];
  
  const availableMarketplaceModules = availableModules?.filter((m) => !isModuleEnabled(m.id) && !m.isDefault) || [];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" data-testid="text-marketplace-title">
              Marketplace
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Expand your organization's capabilities with powerful modules
            </p>
          </div>
          
          {!hasNoPlan && !isFreePlan && (
            <Badge variant="secondary" className="self-start sm:self-auto gap-1.5 px-3 py-1.5">
              <Crown className="w-4 h-4 text-amber-500" />
              <span>All modules included with your plan</span>
            </Badge>
          )}
        </div>

        {(hasNoPlan || isFreePlan) && (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30" data-testid="alert-free-plan">
            <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-800 dark:text-amber-200 font-semibold">
              Upgrade Required
            </AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              <p className="mb-3">
                {hasNoPlan 
                  ? "You don't have an active subscription plan. Marketplace modules are available exclusively with paid subscriptions."
                  : "You're currently on the Free plan. Marketplace modules are available exclusively with paid subscriptions."
                } Upgrade to unlock all modules and expand your organization's capabilities.
              </p>
              <Link href="/dashboard/subscription">
                <Button variant="default" size="sm" className="gap-2" data-testid="button-upgrade-plan">
                  View Upgrade Options
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {enabledMarketplaceModules.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-xl sm:text-2xl font-semibold" data-testid="text-enabled-modules-heading">
                Your Active Modules
              </h2>
            </div>
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {enabledMarketplaceModules.map((module: any) => {
                const Icon = getModuleIcon(module.moduleKey);
                const enabledDate = module.enabledAt 
                  ? new Date(module.enabledAt).toLocaleDateString(undefined, { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })
                  : null;
                
                return (
                  <Card key={module.id} className="flex flex-col relative overflow-hidden" data-testid={`card-enabled-module-${module.id}`}>
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-green-600 hover:bg-green-700 shadow-sm" data-testid={`status-enabled-${module.id}`}>
                        <Check className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                    <CardHeader className="flex-1 pb-4">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                      </div>
                      <CardTitle className="text-lg sm:text-xl" data-testid={`text-module-title-${module.id}`}>
                        {module.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-sm sm:text-base">
                        {module.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {enabledDate && (
                        <p className="text-sm text-muted-foreground">
                          Enabled on {enabledDate}
                        </p>
                      )}
                      <Button
                        variant="outline"
                        className="w-full min-h-[44px]"
                        onClick={() => disableModuleMutation.mutate(module.id)}
                        disabled={disableModuleMutation.isPending}
                        data-testid={`button-disable-${module.id}`}
                      >
                        {disableModuleMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Disabling...
                          </>
                        ) : (
                          "Disable Module"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {availableMarketplaceModules.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl sm:text-2xl font-semibold" data-testid="text-available-modules-heading">
                Available Modules
              </h2>
            </div>
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {availableMarketplaceModules.map((module) => {
                const Icon = getModuleIcon(module.moduleKey);
                
                return (
                  <Card 
                    key={module.id} 
                    className={`flex flex-col ${isFreePlan ? 'opacity-75' : 'hover-elevate'}`} 
                    data-testid={`card-available-module-${module.id}`}
                  >
                    <CardHeader className="flex-1 pb-4">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                      </div>
                      <CardTitle className="text-lg sm:text-xl" data-testid={`text-module-title-${module.id}`}>
                        {module.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-3 text-sm sm:text-base leading-relaxed">
                        {module.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-4">
                      {!hasNoPlan && !isFreePlan && (
                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                          <p className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            Included with your plan
                          </p>
                        </div>
                      )}
                      {isFreePlan ? (
                        <Link href="/dashboard/subscription">
                          <Button
                            variant="outline"
                            className="w-full min-h-[44px] gap-2"
                            data-testid={`button-upgrade-${module.id}`}
                          >
                            <Lock className="w-4 h-4" />
                            Upgrade to Enable
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          className="w-full min-h-[44px]"
                          onClick={() => handleEnableModule(module.id)}
                          data-testid={`button-enable-${module.id}`}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Enable Module
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          !enabledMarketplaceModules.length && (
            <Card data-testid="card-all-modules-enabled" className="border-dashed">
              <CardContent className="py-12 sm:py-16">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg sm:text-xl font-semibold">All modules enabled!</h3>
                    <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                      You have access to all available marketplace modules.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        )}

        <Dialog open={showEnableDialog} onOpenChange={setShowEnableDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle data-testid="text-enable-dialog-title">Enable Module</DialogTitle>
              <DialogDescription>
                Enable <strong data-testid="text-selected-module-title">{selectedModule?.title}</strong> for your organization?
              </DialogDescription>
            </DialogHeader>
            {selectedModule && (
              <div className="space-y-6 py-4">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-start gap-3">
                    {(() => {
                      const Icon = getModuleIcon(selectedModule.moduleKey);
                      return (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                      );
                    })()}
                    <div>
                      <h4 className="font-medium">{selectedModule.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedModule.description}
                      </p>
                    </div>
                  </div>
                </div>

                {!hasNoPlan && !isFreePlan && (
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      This module is included with your subscription at no extra cost.
                    </p>
                  </div>
                )}

                <Form {...enableForm}>
                  <form onSubmit={enableForm.handleSubmit(onEnableSubmit)} className="space-y-4">
                    <FormField
                      control={enableForm.control}
                      name="confirmed"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-confirm-enable"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            I want to enable this module for my organization
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowEnableDialog(false)}
                        data-testid="button-cancel-enable"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={!enableForm.watch("confirmed") || enableModuleMutation.isPending}
                        data-testid="button-confirm-enable"
                      >
                        {enableModuleMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enabling...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Enable Module
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
