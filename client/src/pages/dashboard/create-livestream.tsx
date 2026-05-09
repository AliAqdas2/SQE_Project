import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Loader2, Video } from "lucide-react";
import { Link } from "wouter";

// Helper function to extract YouTube video ID from URL
function extractYouTubeVideoId(url: string): string | null {
  // Various YouTube URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

// Helper function to extract Facebook video ID from URL
function extractFacebookVideoId(url: string): string | null {
  // Various Facebook URL patterns
  const patterns = [
    /facebook\.com\/watch\/\?v=(\d+)/,
    /facebook\.com\/(\d+)/,
    /fb\.watch\/([a-zA-Z0-9_-]+)/,
    /facebook\.com\/.*[?&]v=(\d+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

const livestreamSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  platform: z.enum(["youtube", "facebook", "custom"]),
  videoId: z.string().optional(),
  embedUrl: z.string().url().optional().or(z.literal("")).optional(),
  scheduledStart: z.string().min(1, "Start time is required"),
  scheduledEnd: z.string().min(1, "End time is required"),
  isPaid: z.boolean(),
  ticketPrice: z.string().optional(),
  currency: z.enum(["USD", "GBP", "EUR", "AED"]),
});

type LivestreamFormData = z.infer<typeof livestreamSchema>;

interface User {
  id: string;
  orgId: string;
}

interface SessionResponse {
  user: User;
}

export default function CreateLivestreamPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isPaid, setIsPaid] = useState(false);

  const { data: sessionData } = useQuery<SessionResponse>({
    queryKey: ["/api/auth/session"],
  });
  
  const user = sessionData?.user;

  const form = useForm<LivestreamFormData>({
    resolver: zodResolver(livestreamSchema),
    defaultValues: {
      title: "",
      description: "",
      platform: "youtube",
      videoId: "",
      embedUrl: "",
      scheduledStart: "",
      scheduledEnd: "",
      isPaid: false,
      ticketPrice: "",
      currency: "USD",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: LivestreamFormData & { orgId: string }) => {
      const response = await apiRequest("POST", "/api/livestreams", data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Livestream Created!",
        description: "Your livestream has been created successfully.",
      });
      // Invalidate all livestream queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/livestreams"] });
      // Redirect to list page to show the new livestream
      setLocation(`/dashboard/livestreams`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create livestream",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LivestreamFormData) => {
    console.log("Form submitted with data:", data);
    console.log("User data:", user);
    
    if (!user?.orgId) {
      console.error("User orgId missing:", user);
      toast({
        title: "Error",
        description: "User organization not found",
        variant: "destructive",
      });
      return;
    }

    // Convert datetime-local strings to ISO format
    const payload = {
      ...data,
      orgId: user.orgId,
      scheduledStart: new Date(data.scheduledStart).toISOString(),
      scheduledEnd: new Date(data.scheduledEnd).toISOString(),
      // Only include videoId/embedUrl/ticketPrice if they have values
      videoId: data.videoId || undefined,
      embedUrl: data.embedUrl || undefined,
      ticketPrice: data.isPaid && data.ticketPrice ? data.ticketPrice : undefined,
    };

    console.log("Submitting payload:", payload);
    createMutation.mutate(payload as any);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/livestreams">
          <Button variant="outline" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Livestream</h1>
          <p className="text-muted-foreground">
            Set up a new livestreaming event for your organization
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Livestream Details
          </CardTitle>
          <CardDescription>
            Configure your livestream settings and schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  {...form.register("title")}
                  placeholder="Sunday Service Livestream"
                  data-testid="input-title"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Join us for our weekly service..."
                  rows={4}
                  data-testid="input-description"
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>
            </div>

            {/* Platform Selection */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="platform">Platform</Label>
                <Select
                  value={form.watch("platform")}
                  onValueChange={(value) => form.setValue("platform", value as "youtube" | "facebook" | "custom")}
                >
                  <SelectTrigger data-testid="select-platform">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube Live</SelectItem>
                    <SelectItem value="facebook">Facebook Live</SelectItem>
                    <SelectItem value="custom">Custom Stream</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.watch("platform") === "youtube" && (
                <div>
                  <Label htmlFor="videoId">YouTube Video ID or URL</Label>
                  <Input
                    id="videoId"
                    {...form.register("videoId", {
                      onChange: (e) => {
                        const value = e.target.value;
                        // If it looks like a URL, try to extract the video ID
                        if (value.includes("youtube.com") || value.includes("youtu.be")) {
                          const videoId = extractYouTubeVideoId(value);
                          if (videoId) {
                            form.setValue("videoId", videoId, { shouldValidate: true });
                            toast({
                              title: "Video ID extracted",
                              description: "Video ID has been automatically extracted from the URL.",
                            });
                          }
                        }
                      }
                    })}
                    placeholder="dQw4w9WgXcQ or https://www.youtube.com/watch?v=..."
                    data-testid="input-video-id"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter the video ID or paste the full YouTube URL
                  </p>
                </div>
              )}

              {form.watch("platform") === "facebook" && (
                <div>
                  <Label htmlFor="videoId">Facebook Video ID or URL</Label>
                  <Input
                    id="videoId"
                    {...form.register("videoId", {
                      onChange: (e) => {
                        const value = e.target.value;
                        // If it looks like a URL, try to extract the video ID
                        if (value.includes("facebook.com") || value.includes("fb.watch")) {
                          const videoId = extractFacebookVideoId(value);
                          if (videoId) {
                            form.setValue("videoId", videoId, { shouldValidate: true });
                            toast({
                              title: "Video ID extracted",
                              description: "Video ID has been automatically extracted from the URL.",
                            });
                          }
                        }
                      }
                    })}
                    placeholder="123456789 or https://www.facebook.com/watch/?v=..."
                    data-testid="input-video-id"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter the video ID or paste the full Facebook URL
                  </p>
                </div>
              )}

              {form.watch("platform") === "custom" && (
                <div>
                  <Label htmlFor="embedUrl">Embed URL</Label>
                  <Input
                    id="embedUrl"
                    {...form.register("embedUrl")}
                    placeholder="https://example.com/stream/embed"
                    data-testid="input-embed-url"
                  />
                </div>
              )}
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduledStart">Start Time</Label>
                <Input
                  id="scheduledStart"
                  type="datetime-local"
                  {...form.register("scheduledStart")}
                  data-testid="input-scheduled-start"
                />
                {form.formState.errors.scheduledStart && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.scheduledStart.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="scheduledEnd">End Time</Label>
                <Input
                  id="scheduledEnd"
                  type="datetime-local"
                  {...form.register("scheduledEnd")}
                  data-testid="input-scheduled-end"
                />
                {form.formState.errors.scheduledEnd && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.scheduledEnd.message}
                  </p>
                )}
              </div>
            </div>

            {/* Paid Access */}
            <div className="space-y-4 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isPaid">Paid Access</Label>
                  <p className="text-sm text-muted-foreground">
                    Require ticket purchase to view livestream
                  </p>
                </div>
                <Switch
                  id="isPaid"
                  checked={isPaid}
                  onCheckedChange={(checked) => {
                    setIsPaid(checked);
                    form.setValue("isPaid", checked);
                  }}
                  data-testid="switch-is-paid"
                />
              </div>

              {isPaid && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ticketPrice">Ticket Price</Label>
                    <Input
                      id="ticketPrice"
                      type="number"
                      step="0.01"
                      {...form.register("ticketPrice")}
                      placeholder="10.00"
                      data-testid="input-ticket-price"
                    />
                  </div>

                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={form.watch("currency")}
                      onValueChange={(value) => form.setValue("currency", value as "USD" | "GBP" | "EUR" | "AED")}
                    >
                      <SelectTrigger data-testid="select-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="AED">AED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <Link href="/dashboard/livestreams" className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={createMutation.isPending}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                className="flex-1"
                disabled={createMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Livestream"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
