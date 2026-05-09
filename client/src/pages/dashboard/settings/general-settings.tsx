import { useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Building2, Globe, MapPin, Loader2, Upload, Palette, Image, X, Check } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  religion: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  timezone: string | null;
  currency: string | null;
  dateFormat: string | null;
  settings?: {
    giftAidPercentage?: number;
  } | null;
}

const generalSettingsSchema = z.object({
  name: z.string().min(2, "Organization name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  religion: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  dateFormat: z.string().optional(),
  giftAidPercentage: z.number().min(0).max(100).optional(),
});

type GeneralSettingsForm = z.infer<typeof generalSettingsSchema>;

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (US)" },
  { value: "America/Chicago", label: "Central Time (US)" },
  { value: "America/Denver", label: "Mountain Time (US)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US)" },
  { value: "Europe/London", label: "London (UK)" },
  { value: "Europe/Paris", label: "Paris (EU)" },
  { value: "Asia/Dubai", label: "Dubai (UAE)" },
  { value: "Africa/Johannesburg", label: "Johannesburg (SA)" },
  { value: "Asia/Kolkata", label: "India Standard Time" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Australia/Sydney", label: "Sydney (AU)" },
];

const CURRENCIES = [
  { value: "USD", label: "US Dollar ($)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "AED", label: "UAE Dirham (د.إ)" },
  { value: "ZAR", label: "South African Rand (R)" },
  { value: "INR", label: "Indian Rupee (₹)" },
  { value: "AUD", label: "Australian Dollar (A$)" },
  { value: "CAD", label: "Canadian Dollar (C$)" },
];

const DATE_FORMATS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (US)" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (UK/EU)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" },
];

const RELIGIONS = [
  { value: "christian", label: "Christian" },
  { value: "muslim", label: "Muslim" },
  { value: "jewish", label: "Jewish" },
  { value: "hindu", label: "Hindu" },
  { value: "buddhist", label: "Buddhist" },
  { value: "sikh", label: "Sikh" },
  { value: "other", label: "Other" },
];

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "ZA", label: "South Africa" },
  { value: "IN", label: "India" },
  { value: "AU", label: "Australia" },
  { value: "CA", label: "Canada" },
];

const BRAND_COLORS = [
  { value: "#00BCD4", label: "Cyan" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#EC4899", label: "Pink" },
  { value: "#EF4444", label: "Red" },
  { value: "#F97316", label: "Orange" },
  { value: "#EAB308", label: "Yellow" },
  { value: "#22C55E", label: "Green" },
  { value: "#14B8A6", label: "Teal" },
  { value: "#6366F1", label: "Indigo" },
];

interface GeneralSettingsProps {
  orgId: string;
}

export default function GeneralSettings({ orgId }: GeneralSettingsProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const { data: organization, isLoading } = useQuery<Organization>({
    queryKey: [`/api/org/${orgId}`],
    enabled: !!orgId,
  });

  const form = useForm<GeneralSettingsForm>({
    resolver: zodResolver(generalSettingsSchema),
    values: organization ? {
      name: organization.name || "",
      email: organization.email || "",
      phone: organization.phone || "",
      religion: organization.religion || "",
      street: organization.street || "",
      city: organization.city || "",
      state: organization.state || "",
      zip: organization.zip || "",
      country: organization.country || "",
      timezone: organization.timezone || "America/New_York",
      currency: organization.currency || "USD",
      dateFormat: organization.dateFormat || "MM/DD/YYYY",
      giftAidPercentage: organization.settings?.giftAidPercentage || 25,
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: GeneralSettingsForm) => {
      // Extract giftAidPercentage and store in settings
      const { giftAidPercentage, ...orgData } = data;
      const settings = giftAidPercentage !== undefined ? { giftAidPercentage } : {};
      const response = await apiRequest("PATCH", `/api/org/${orgId}`, {
        ...orgData,
        settings: organization?.settings ? { ...organization.settings, ...settings } : settings,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}`] });
      toast({
        title: "Settings Saved",
        description: "Your organization settings have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "logo");
      const response = await fetch(`/api/org/${orgId}/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to upload logo");
      }
      return response.json();
    },
    onSuccess: async (data) => {
      if (data.url) {
        setLogoPreview(data.url);
        await apiRequest("PATCH", `/api/org/${orgId}`, { logoUrl: data.url });
        queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}`] });
        queryClient.invalidateQueries({ queryKey: ["/api/org"] });
        toast({
          title: "Logo Uploaded",
          description: "Your organization logo has been updated successfully.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
      setLogoPreview(null);
    },
  });

  const removeLogoMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/org/${orgId}`, { logoUrl: null });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/org"] });
      setLogoPreview(null);
      toast({
        title: "Logo Removed",
        description: "Your organization logo has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove logo",
        variant: "destructive",
      });
    },
  });

  const updateColorMutation = useMutation({
    mutationFn: async (color: string) => {
      const response = await apiRequest("PATCH", `/api/org/${orgId}`, { primaryColor: color });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}`] });
      toast({
        title: "Brand Color Updated",
        description: "Your brand color has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update brand color",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      uploadLogoMutation.mutate(file);
    }
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    updateColorMutation.mutate(color);
  };

  const onSubmit = (data: GeneralSettingsForm) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentLogo = logoPreview || organization?.logoUrl;
  const currentColor = selectedColor || organization?.primaryColor || "#00BCD4";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Branding & White Label
          </CardTitle>
          <CardDescription>
            Customize your organization's logo and brand colors. These will appear across your dashboard, public landing page, and volunteer portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Image className="h-4 w-4" />
                Organization Logo
              </Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative group cursor-pointer border-2 border-dashed rounded-xl p-8 hover:border-primary/50 transition-colors bg-muted/30"
                data-testid="upload-logo-area"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  data-testid="input-logo-upload"
                />
                {currentLogo ? (
                  <div className="relative flex flex-col items-center">
                    <img
                      src={currentLogo}
                      alt="Logo preview"
                      className="w-32 h-32 object-contain rounded-lg"
                      data-testid="img-logo-preview"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">Click to change logo</p>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Upload your logo</p>
                      <p className="text-sm text-muted-foreground">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {currentLogo && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeLogoMutation.mutate()}
                  disabled={removeLogoMutation.isPending}
                  className="w-full"
                  data-testid="button-remove-logo"
                >
                  {removeLogoMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  Remove Logo
                </Button>
              )}
              {uploadLogoMutation.isPending && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Brand Color
              </Label>
              <p className="text-sm text-muted-foreground">
                Choose a primary color that represents your organization
              </p>
              <div className="grid grid-cols-5 gap-3">
                {BRAND_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleColorChange(color.value)}
                    className={`relative w-12 h-12 rounded-lg transition-all hover:scale-110 ${
                      currentColor === color.value
                        ? "ring-2 ring-offset-2 ring-primary"
                        : ""
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                    data-testid={`color-${color.value.replace('#', '')}`}
                  >
                    {currentColor === color.value && (
                      <Check className="absolute inset-0 m-auto w-5 h-5 text-white drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
              {updateColorMutation.isPending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating color...
                </div>
              )}

              <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm font-medium mb-2">Preview</p>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background border">
                  {currentLogo ? (
                    <img src={currentLogo} alt="Preview" className="w-10 h-10 object-contain rounded" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{organization?.name || "Your Organization"}</p>
                    <p className="text-xs text-muted-foreground">Dashboard header preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organization Details
              </CardTitle>
              <CardDescription>
                Basic information about your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Organization" {...field} data-testid="input-org-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@example.org" {...field} data-testid="input-org-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 000-0000" {...field} data-testid="input-org-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="religion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Faith Tradition</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-religion">
                            <SelectValue placeholder="Select faith tradition" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {RELIGIONS.map((religion) => (
                            <SelectItem key={religion.value} value={religion.value}>
                              {religion.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        This determines donation categories like Zakat, Tithe, etc.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address
              </CardTitle>
              <CardDescription>
                Your organization's physical location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main Street" {...field} data-testid="input-street" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} data-testid="input-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State / Province</FormLabel>
                      <FormControl>
                        <Input placeholder="State" {...field} data-testid="input-state" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="12345" {...field} data-testid="input-zip" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-country">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      This affects tax relief programs like Gift Aid (UK)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Regional Settings
              </CardTitle>
              <CardDescription>
                Configure timezone, currency, and date formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-timezone">
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
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
                      <FormLabel>Default Currency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-currency">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CURRENCIES.map((currency) => (
                            <SelectItem key={currency.value} value={currency.value}>
                              {currency.label}
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
                  name="dateFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Format</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-date-format">
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DATE_FORMATS.map((format) => (
                            <SelectItem key={format.value} value={format.value}>
                              {format.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Gift Aid Settings (UK only) */}
          {organization?.country === "GB" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Gift Aid Settings
                </CardTitle>
                <CardDescription>
                  Configure Gift Aid percentage for UK donations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="giftAidPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gift Aid Percentage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="25"
                          value={field.value?.toString() || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          data-testid="input-gift-aid-percentage"
                        />
                      </FormControl>
                      <FormDescription>
                        The percentage of donation amount that can be claimed as Gift Aid (default: 25%)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-settings">
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
