import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MapPin, Clock } from "lucide-react";

interface SessionResponse {
  user: {
    orgId: string;
  };
}

interface PrayerSettings {
  id: string;
  orgId: string;
  city: string;
  country: string;
  latitude: string | null;
  longitude: string | null;
  calculationMethod: number;
  timezone: string;
}

const prayerSettingsSchema = z.object({
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  calculationMethod: z.number().int().min(0).max(15),
  timezone: z.string().min(1, "Timezone is required"),
});

type PrayerSettingsForm = z.infer<typeof prayerSettingsSchema>;

const calculationMethods = [
  { value: 0, label: "Shia Ithna-Ansari" },
  { value: 1, label: "University of Islamic Sciences, Karachi" },
  { value: 2, label: "Islamic Society of North America (ISNA)" },
  { value: 3, label: "Muslim World League (MWL)" },
  { value: 4, label: "Umm al-Qura, Makkah" },
  { value: 5, label: "Egyptian General Authority of Survey" },
  { value: 7, label: "Institute of Geophysics, University of Tehran" },
  { value: 8, label: "Gulf Region" },
  { value: 9, label: "Kuwait" },
  { value: 10, label: "Qatar" },
  { value: 11, label: "Majlis Ugama Islam Singapura, Singapore" },
  { value: 12, label: "Union Organization islamic de France" },
  { value: 13, label: "Diyanet İşleri Başkanlığı, Turkey" },
  { value: 14, label: "Spiritual Administration of Muslims of Russia" },
];

export default function PrayerSettingsPage() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const { data: sessionData } = useQuery<SessionResponse>({
    queryKey: ["/api/auth/session"],
  });

  const orgId = sessionData?.user?.orgId;

  const { data: settings, isLoading } = useQuery<PrayerSettings | null>({
    queryKey: [`/api/org/${orgId}/prayer-settings`],
    enabled: !!orgId,
  });

  const form = useForm<PrayerSettingsForm>({
    resolver: zodResolver(prayerSettingsSchema),
    defaultValues: {
      city: "",
      country: "",
      latitude: "",
      longitude: "",
      calculationMethod: 2,
      timezone: "",
    },
  });

  // Reset form when settings are loaded or when editing mode changes
  useEffect(() => {
    if (settings && !isEditing) {
      form.reset({
        city: settings.city,
        country: settings.country,
        latitude: settings.latitude || "",
        longitude: settings.longitude || "",
        calculationMethod: settings.calculationMethod,
        timezone: settings.timezone,
      });
    }
  }, [settings, isEditing, form]);

  const createMutation = useMutation({
    mutationFn: async (data: PrayerSettingsForm) => {
      return apiRequest("POST", `/api/org/${orgId}/prayer-settings`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}/prayer-settings`] });
      toast({
        title: "Prayer settings saved",
        description: "Your location has been configured successfully.",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error saving settings",
        description: error.message || "Failed to save prayer settings",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: PrayerSettingsForm) => {
      return apiRequest("PATCH", `/api/org/${orgId}/prayer-settings`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}/prayer-settings`] });
      toast({
        title: "Prayer settings updated",
        description: "Your location has been updated successfully.",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating settings",
        description: error.message || "Failed to update prayer settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PrayerSettingsForm) => {
    if (settings) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const hasSettings = !!settings;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold">Prayer Times Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure your organization's location to display accurate prayer times
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Settings
          </CardTitle>
          <CardDescription>
            Set your organization's location to display accurate prayer times on your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasSettings && !isEditing ? (
            <div className="text-center py-8">
              <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Location Configured</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Configure your organization's location to display accurate Islamic prayer times on your dashboard.
              </p>
              <Button onClick={() => setIsEditing(true)} data-testid="button-configure-location">
                Configure Location
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="London" {...field} data-testid="input-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="UK" {...field} data-testid="input-country" />
                        </FormControl>
                        <FormDescription>Use 2-letter country code (e.g., UK, US, AE)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="51.5074" {...field} data-testid="input-latitude" />
                        </FormControl>
                        <FormDescription>For more accurate prayer times</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="-0.1278" {...field} data-testid="input-longitude" />
                        </FormControl>
                        <FormDescription>For more accurate prayer times</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <FormControl>
                        <Input placeholder="Europe/London" {...field} data-testid="input-timezone" />
                      </FormControl>
                      <FormDescription>IANA timezone (e.g., Europe/London, Asia/Dubai, America/New_York)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="calculationMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calculation Method</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-calculation-method">
                            <SelectValue placeholder="Select calculation method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {calculationMethods.map((method) => (
                            <SelectItem key={method.value} value={method.value.toString()}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Choose the method used to calculate prayer times</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-settings"
                  >
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                  {hasSettings && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        form.reset();
                      }}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          )}

          {hasSettings && !isEditing && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">City</p>
                  <p className="text-lg">{settings.city}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Country</p>
                  <p className="text-lg">{settings.country}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Timezone</p>
                  <p className="text-lg">{settings.timezone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Calculation Method</p>
                  <p className="text-lg">
                    {calculationMethods.find((m) => m.value === settings.calculationMethod)?.label || "Unknown"}
                  </p>
                </div>
              </div>
              <Button onClick={() => setIsEditing(true)} variant="outline" data-testid="button-edit-settings">
                Edit Settings
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
