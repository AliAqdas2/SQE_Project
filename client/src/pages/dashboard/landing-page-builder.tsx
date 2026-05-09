import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Globe, Settings as SettingsIcon, Eye, Share2, QrCode as QrCodeIcon, Palette, Upload, X } from "lucide-react";
import QRCode from "qrcode";

interface SessionResponse {
  user: {
    orgId: string;
  };
}

interface LandingPage {
  id: string;
  orgId: string;
  slug: string;
  title: string;
  description: string | null;
  heroImageUrl: string | null;
  bannerImageUrl: string | null;
  aboutUs: string | null;
  pageComponents: any[];
  settings: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    showCampaigns?: boolean;
    showEvents?: boolean;
    showLivestreams?: boolean;
    showDonations?: boolean;
    showPrayerTimes?: boolean;
    showSermons?: boolean;
    showVolunteers?: boolean;
    showChatbot?: boolean;
    moduleOrder?: string[];
  };
  isPublished: boolean;
  publishedAt: string | null;
}

interface EnabledModule {
  id: string;
  orgId: string;
  moduleId: string;
  module: {
    moduleKey: string;
    title: string;
  };
}

interface Organization {
  id: string;
  name: string;
  slug: string;
}

const landingPageSchema = z.object({
  slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  heroImageUrl: z.string().url().optional().or(z.literal("")),
  bannerImageUrl: z.string().url().optional().or(z.literal("")),
  aboutUs: z.string().optional(),
  showCampaigns: z.boolean(),
  showEvents: z.boolean(),
  showLivestreams: z.boolean(),
  showDonations: z.boolean(),
  showPrayerTimes: z.boolean(),
  showSermons: z.boolean(),
  showVolunteers: z.boolean(),
  showChatbot: z.boolean(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").optional(),
  moduleOrder: z.array(z.string()).optional(),
});

type LandingPageForm = z.infer<typeof landingPageSchema>;

// Convert organization name to URL-friendly slug
const nameToSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric characters with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

export default function LandingPageBuilder() {
  const { toast } = useToast();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  const { data: sessionData } = useQuery<SessionResponse>({
    queryKey: ["/api/auth/session"],
  });

  const orgId = sessionData?.user?.orgId;

  const { data: landingPage, isLoading } = useQuery<LandingPage | null>({
    queryKey: [`/api/org/${orgId}/landing-page`],
    enabled: !!orgId,
  });

  // Fetch organization data to pre-populate slug
  const { data: organization } = useQuery<Organization>({
    queryKey: [`/api/org/${orgId}`],
    enabled: !!orgId,
  });

  // Fetch enabled modules to conditionally show certain toggles
  const { data: enabledModules } = useQuery<EnabledModule[]>({
    queryKey: [`/api/org/${orgId}/modules`],
    enabled: !!orgId,
  });

  // Check if specific modules are enabled
  const isModuleEnabled = (moduleKey: string) => {
    return enabledModules?.some((em) => em.module.moduleKey === moduleKey) || false;
  };

  const form = useForm<LandingPageForm>({
    resolver: zodResolver(landingPageSchema),
    defaultValues: {
      slug: "",
      title: "",
      description: "",
      heroImageUrl: "",
      bannerImageUrl: "",
      aboutUs: "",
      showCampaigns: true,
      showEvents: true,
      showLivestreams: true,
      showDonations: true,
      showPrayerTimes: false,
      showSermons: false,
      showVolunteers: false,
      showChatbot: true,
      primaryColor: "#00BCD4",
      secondaryColor: "#FF5722",
      moduleOrder: ["campaigns", "events", "livestreams", "donations", "prayerTimes", "sermons", "volunteers"],
    },
  });

  // Reset form when landing page data loads or organization data loads
  useEffect(() => {
    if (landingPage) {
      const settings = landingPage.settings || {};
      form.reset({
        slug: landingPage.slug,
        title: landingPage.title,
        description: landingPage.description || "",
        heroImageUrl: landingPage.heroImageUrl || "",
        bannerImageUrl: landingPage.bannerImageUrl || "",
        aboutUs: landingPage.aboutUs || "",
        showCampaigns: settings.showCampaigns !== false,
        showEvents: settings.showEvents !== false,
        showLivestreams: settings.showLivestreams !== false,
        showDonations: settings.showDonations !== false,
        showPrayerTimes: settings.showPrayerTimes || false,
        showSermons: settings.showSermons || false,
        showVolunteers: settings.showVolunteers || false,
        showChatbot: settings.showChatbot !== false,
        primaryColor: settings.primaryColor || "#00BCD4",
        secondaryColor: settings.secondaryColor || "#FF5722",
        moduleOrder: settings.moduleOrder || ["campaigns", "events", "livestreams", "donations", "prayerTimes", "sermons", "volunteers"],
      });
    } else if (organization && !form.getValues().slug) {
      // Pre-populate slug from organization name if no landing page exists and slug is empty
      const defaultSlug = organization.name ? nameToSlug(organization.name) : "";
      if (defaultSlug) {
        form.setValue('slug', defaultSlug);
      }
    }
  }, [landingPage, organization, form]);

  // Generate QR code when landing page exists
  useEffect(() => {
    if (landingPage) {
      const url = `${window.location.origin}/p/${landingPage.slug}`;
      QRCode.toDataURL(url, { width: 300, margin: 2 })
        .then(setQrCodeUrl)
        .catch(console.error);
    }
  }, [landingPage]);

  const createMutation = useMutation({
    mutationFn: async (data: LandingPageForm) => {
      return apiRequest("POST", `/api/org/${orgId}/landing-page`, {
        slug: data.slug,
        title: data.title,
        description: data.description,
        heroImageUrl: data.heroImageUrl,
        bannerImageUrl: data.bannerImageUrl,
        aboutUs: data.aboutUs,
        pageComponents: [],
        settings: {
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          fontFamily: "Inter",
          showCampaigns: data.showCampaigns,
          showEvents: data.showEvents,
          showLivestreams: data.showLivestreams,
          showDonations: data.showDonations,
          showPrayerTimes: data.showPrayerTimes,
          showSermons: data.showSermons,
          showVolunteers: data.showVolunteers,
          showChatbot: data.showChatbot,
          moduleOrder: data.moduleOrder,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}/landing-page`] });
      toast({
        title: "Landing page created",
        description: "Your landing page has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating landing page",
        description: error.message || "Failed to create landing page",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: LandingPageForm) => {
      return apiRequest("PATCH", `/api/org/${orgId}/landing-page`, {
        slug: data.slug,
        title: data.title,
        description: data.description,
        heroImageUrl: data.heroImageUrl,
        bannerImageUrl: data.bannerImageUrl,
        aboutUs: data.aboutUs,
        settings: {
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          fontFamily: "Inter",
          showCampaigns: data.showCampaigns,
          showEvents: data.showEvents,
          showLivestreams: data.showLivestreams,
          showDonations: data.showDonations,
          showPrayerTimes: data.showPrayerTimes,
          showSermons: data.showSermons,
          showVolunteers: data.showVolunteers,
          showChatbot: data.showChatbot,
          moduleOrder: data.moduleOrder,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}/landing-page`] });
      toast({
        title: "Landing page updated",
        description: "Your landing page has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating landing page",
        description: error.message || "Failed to update landing page",
        variant: "destructive",
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/org/${orgId}/landing-page/publish`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}/landing-page`] });
      toast({
        title: "Landing page published",
        description: "Your landing page is now live and accessible to the public.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error publishing",
        description: error.message || "Failed to publish landing page",
        variant: "destructive",
      });
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/org/${orgId}/landing-page/unpublish`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}/landing-page`] });
      toast({
        title: "Landing page unpublished",
        description: "Your landing page is no longer publicly accessible.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error unpublishing",
        description: error.message || "Failed to unpublish landing page",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (file: File, type: 'hero' | 'banner') => {
    const setUploading = type === 'hero' ? setUploadingHero : setUploadingBanner;
    
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`/api/org/${orgId}/landing-page/upload-image`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      
      // Update form with the new image URL
      if (type === 'hero') {
        form.setValue('heroImageUrl', data.url);
      } else {
        form.setValue('bannerImageUrl', data.url);
      }
      
      toast({
        title: "Image uploaded",
        description: `${type === 'hero' ? 'Hero' : 'Banner'} image uploaded successfully.`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (data: LandingPageForm) => {
    if (landingPage) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The link has been copied to your clipboard.",
    });
  };

  const shareUrl = landingPage ? `${window.location.origin}/p/${landingPage.slug}` : "";

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold">Landing Page Builder</h1>
          <p className="text-muted-foreground mt-2">
            Create a beautiful public page to showcase your campaigns, events, and livestreams
          </p>
        </div>
        {landingPage && (
          <div className="flex gap-2">
            {landingPage.isPublished ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => window.open(shareUrl, "_blank")}
                  data-testid="button-preview-landing-page"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  onClick={() => unpublishMutation.mutate()}
                  disabled={unpublishMutation.isPending}
                  data-testid="button-unpublish"
                >
                  Unpublish
                </Button>
              </>
            ) : (
              <Button
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
                data-testid="button-publish"
              >
                <Globe className="h-4 w-4 mr-2" />
                Publish Landing Page
              </Button>
            )}
          </div>
        )}
      </div>

      {landingPage && landingPage.isPublished && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Globe className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1 space-y-3">
                <div>
                  <p className="font-semibold">Your landing page is live!</p>
                  <p className="text-sm text-muted-foreground">
                    Share it with your supporters and donors
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(shareUrl)}
                    data-testid="button-copy-link"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
                <p className="text-sm font-mono bg-muted px-3 py-2 rounded-md break-all">
                  {shareUrl}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" data-testid="tab-general">
            <SettingsIcon className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="design" data-testid="tab-design">
            <Palette className="h-4 w-4 mr-2" />
            Design
          </TabsTrigger>
          <TabsTrigger value="share" disabled={!landingPage} data-testid="tab-share">
            <QrCodeIcon className="h-4 w-4 mr-2" />
            Share & QR
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Set up your landing page title, URL, and description
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Page URL (Slug)</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{window.location.origin}/p/</span>
                            <Input placeholder="my-organization" {...field} data-testid="input-slug" />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Use lowercase letters, numbers, and hyphens only
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Page Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Welcome to Our Organization" {...field} data-testid="input-title" />
                        </FormControl>
                        <FormDescription>
                          This will appear as the main heading on your landing page
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell visitors about your organization and mission..."
                            {...field}
                            data-testid="input-description"
                          />
                        </FormControl>
                        <FormDescription>
                          A brief description that appears below your page title
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="heroImageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hero Image (Optional)</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            {field.value && (
                              <div className="relative rounded-lg overflow-hidden border">
                                <img 
                                  src={field.value} 
                                  alt="Hero preview" 
                                  className="w-full h-48 object-cover"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 right-2"
                                  onClick={() => form.setValue('heroImageUrl', '')}
                                  data-testid="button-remove-hero-image"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <input
                                ref={heroFileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageUpload(file, 'hero');
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => heroFileInputRef.current?.click()}
                                disabled={uploadingHero}
                                data-testid="button-upload-hero-image"
                              >
                                <Upload className="mr-2 h-4 w-4" />
                                {uploadingHero ? 'Uploading...' : 'Upload Image'}
                              </Button>
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          A large banner image that appears at the top of your page
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bannerImageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banner Image (Optional)</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            {field.value && (
                              <div className="relative rounded-lg overflow-hidden border">
                                <img 
                                  src={field.value} 
                                  alt="Banner preview" 
                                  className="w-full h-32 object-cover"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 right-2"
                                  onClick={() => form.setValue('bannerImageUrl', '')}
                                  data-testid="button-remove-banner-image"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <input
                                ref={bannerFileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageUpload(file, 'banner');
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => bannerFileInputRef.current?.click()}
                                disabled={uploadingBanner}
                                data-testid="button-upload-banner-image"
                              >
                                <Upload className="mr-2 h-4 w-4" />
                                {uploadingBanner ? 'Uploading...' : 'Upload Image'}
                              </Button>
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          A banner displayed below the organization name
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="aboutUs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>About Us Section (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Write about your organization's mission, vision, and impact..."
                            {...field}
                            rows={6}
                            data-testid="input-about-us"
                          />
                        </FormControl>
                        <FormDescription>
                          This appears prominently at the top of your landing page
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Sections</CardTitle>
                  <CardDescription>
                    Choose which sections to display on your landing page
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="showCampaigns"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Show Campaigns</FormLabel>
                          <FormDescription>
                            Display your active fundraising campaigns
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-show-campaigns"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="showEvents"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Show Events</FormLabel>
                          <FormDescription>
                            Display your upcoming and active events
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-show-events"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="showLivestreams"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Show Livestreams</FormLabel>
                          <FormDescription>
                            Display your live and upcoming livestream events
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-show-livestreams"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="showDonations"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Show Donation Panel</FormLabel>
                          <FormDescription>
                            Display a donation panel for quick contributions
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-show-donations"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {isModuleEnabled("prayer_timetable") && (
                    <FormField
                      control={form.control}
                      name="showPrayerTimes"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Show Prayer Times</FormLabel>
                            <FormDescription>
                              Display Islamic prayer times for your community
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-show-prayer-times"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="showSermons"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Show Sermons & Media</FormLabel>
                          <FormDescription>
                            Display your sermon library and media content
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-show-sermons"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {isModuleEnabled("volunteer_management") && (
                    <FormField
                      control={form.control}
                      name="showVolunteers"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Show Volunteer Opportunities</FormLabel>
                            <FormDescription>
                              Display volunteer opportunities and sign-up options
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-show-volunteers"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="showChatbot"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Show AI Chatbot</FormLabel>
                          <FormDescription>
                            Enable AI assistant to answer visitor questions
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-show-chatbot"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-landing-page"
              >
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : landingPage ? "Update Landing Page" : "Create Landing Page"}
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="design" className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Color Scheme</CardTitle>
                  <CardDescription>
                    Customize the colors for your landing page
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="primaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Color</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-3">
                            <Input 
                              type="color"
                              {...field}
                              className="w-20 h-10"
                              data-testid="input-primary-color"
                            />
                            <Input 
                              {...field}
                              placeholder="#00BCD4"
                              className="flex-1"
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Used for buttons and accent elements
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="secondaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secondary Color</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-3">
                            <Input 
                              type="color"
                              {...field}
                              className="w-20 h-10"
                              data-testid="input-secondary-color"
                            />
                            <Input 
                              {...field}
                              placeholder="#FF5722"
                              className="flex-1"
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Used for secondary buttons and highlights
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-design"
              >
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Design"}
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="share" className="space-y-6">
          {landingPage && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>QR Code</CardTitle>
                  <CardDescription>
                    Download or print this QR code to share your landing page
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                  {qrCodeUrl && (
                    <>
                      <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64 border rounded-lg" />
                      <Button
                        variant="outline"
                        onClick={() => {
                          const link = document.createElement("a");
                          link.download = `${landingPage.slug}-qr-code.png`;
                          link.href = qrCodeUrl;
                          link.click();
                        }}
                        data-testid="button-download-qr"
                      >
                        <QrCodeIcon className="h-4 w-4 mr-2" />
                        Download QR Code
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Share on Social Media</CardTitle>
                  <CardDescription>
                    Share your landing page on social media platforms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank")}
                    data-testid="button-share-facebook"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share on Facebook
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(landingPage.title)}`, "_blank")}
                    data-testid="button-share-twitter"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share on Twitter
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank")}
                    data-testid="button-share-linkedin"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share on LinkedIn
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(landingPage.title + " " + shareUrl)}`, "_blank")}
                    data-testid="button-share-whatsapp"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share on WhatsApp
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
