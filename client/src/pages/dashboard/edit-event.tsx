import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Calendar, MapPin, Users, Coins, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ImageUpload } from "@/components/image-upload";
import { insertEventSchema, type Event } from "@shared/schema";

const formSchema = insertEventSchema.extend({
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditEventPage() {
  const [, params] = useRoute("/dashboard/events/:eventId/edit");
  const eventId = params?.eventId || "";
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orgId: "",
      title: "",
      description: "",
      imageUrl: "",
      eventType: "in-person",
      date: "",
      time: "",
      location: "",
      livestreamUrl: "",
      capacity: 100,
      price: "0",
      currency: "USD",
      allowDonations: false,
      status: "upcoming",
    },
  });

  useEffect(() => {
    if (event) {
      form.reset({
        orgId: event.orgId,
        title: event.title,
        description: event.description || "",
        imageUrl: event.imageUrl || "",
        eventType: event.eventType || "in-person",
        date: new Date(event.date).toISOString().split('T')[0],
        time: event.time,
        location: event.location || "",
        livestreamUrl: event.livestreamUrl || "",
        capacity: event.capacity,
        price: event.price,
        currency: event.currency || "USD",
        allowDonations: event.allowDonations || false,
        status: event.status || "upcoming",
      });
    }
  }, [event, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const eventData = {
        ...data,
        date: new Date(data.date).toISOString(),
      };
      return await apiRequest("PATCH", `/api/events/${eventId}`, eventData);
    },
    onSuccess: () => {
      toast({
        title: "Event Updated",
        description: "Your event has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setLocation("/dashboard/events");
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update event. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Event not found</p>
      </div>
    );
  }

  const eventType = form.watch("eventType");

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Event</h1>
        <p className="text-muted-foreground">Update your event details</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ImageUpload
                        value={field.value || ""}
                        onChange={field.onChange}
                        label="Event Banner Image"
                        endpoint="/api/events/upload-image"
                      />
                    </FormControl>
                    <FormDescription>
                      Upload a banner image for your event (recommended: 1200x630px)
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
                    <FormLabel>Event Title</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-[120px]"
                        {...field}
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eventType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-event-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="in-person">In-Person</SelectItem>
                        <SelectItem value="virtual">Virtual</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Date & Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Calendar className="h-4 w-4 inline mr-2" />
                        Date
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} data-testid="input-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {(eventType === "in-person" || eventType === "hybrid") && (
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <MapPin className="h-4 w-4 inline mr-2" />
                        Location
                      </FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {(eventType === "virtual" || eventType === "hybrid") && (
                <FormField
                  control={form.control}
                  name="livestreamUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Video className="h-4 w-4 inline mr-2" />
                        Livestream URL
                      </FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="input-livestream" />
                      </FormControl>
                      <FormDescription>Optional: Add a link to your livestream</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Capacity & Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Users className="h-4 w-4 inline mr-2" />
                      Capacity
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-capacity"
                      />
                    </FormControl>
                    <FormDescription>Maximum number of attendees</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Coins className="h-4 w-4 inline mr-2" />
                        Ticket Price
                      </FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} data-testid="input-price" />
                      </FormControl>
                      <FormDescription>Set to 0 for free events</FormDescription>
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-currency">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="AED">AED</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="allowDonations"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Accept Donations</FormLabel>
                      <FormDescription>
                        Allow attendees to add a donation during registration
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-donations"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/dashboard/events")}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              data-testid="button-save"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
