import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
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
import { Skeleton } from "@/components/ui/skeleton";
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
  embedUrl: z.union([z.string().url(), z.literal("")]).optional(),
  scheduledStart: z.string().min(1, "Start time is required"),
  scheduledEnd: z.string().min(1, "End time is required"),
  isPaid: z.boolean(),
  ticketPrice: z.string().optional(),
  currency: z.enum(["USD", "GBP", "EUR", "AED"]),
});

type LivestreamFormData = z.infer<typeof livestreamSchema>;

interface Livestream {
  id: string;
  title: string;
  description: string;
  platform: string;
  videoId: string;
  embedUrl: string;
  scheduledStart: string;
  scheduledEnd: string;
  isPaid: boolean;
  ticketPrice: string;
  currency: string;
}

export default function EditLivestreamPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: livestream, isLoading } = useQuery<Livestream>({
    queryKey: [`/api/livestreams/${id}`],
    enabled: !!id,
  });

  const [isPaid, setIsPaid] = useState(false);

  // Sync isPaid state when livestream data loads
  useEffect(() => {
    if (livestream) {
      setIsPaid(livestream.isPaid);
    }
  }, [livestream]);

  const form = useForm<LivestreamFormData>({
    resolver: zodResolver(livestreamSchema),
    values: livestream
      ? {
          title: livestream.title,
          description: livestream.description,
          platform: livestream.platform as "youtube" | "facebook" | "custom",
          videoId: livestream.videoId || "",
          embedUrl: livestream.embedUrl || "",
          scheduledStart: livestream.scheduledStart
            ? new Date(livestream.scheduledStart).toISOString().slice(0, 16)
            : "",
          scheduledEnd: livestream.scheduledEnd
            ? new Date(livestream.scheduledEnd).toISOString().slice(0, 16)
            : "",
          isPaid: livestream.isPaid,
          ticketPrice: livestream.ticketPrice || "",
          currency: livestream.currency as "USD" | "GBP" | "EUR" | "AED",
        }
      : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<LivestreamFormData>) => {
      const response = await apiRequest("PATCH", `/api/livestreams/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Livestream Updated!",
        description: "Your changes have been saved successfully.",
      });
      // Invalidate all livestream queries (list and individual)
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && key.startsWith('/api/livestreams');
        }
      });
      setLocation(`/dashboard/livestreams/${id}/manage`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update livestream",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LivestreamFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!livestream) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Livestream Not Found</CardTitle>
            <CardDescription>
              The livestream you're trying to edit doesn't exist.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/livestreams/${id}/manage`}>
          <Button variant="outline" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Livestream</h1>
          <p className="text-muted-foreground">
            Update your livestream settings
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
              <Link href={`/dashboard/livestreams/${id}/manage`} className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={updateMutation.isPending}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                className="flex-1"
                disabled={updateMutation.isPending}
                data-testid="button-submit"
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
        </CardContent>
      </Card>
    </div>
  );
}
