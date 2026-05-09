import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Sparkles, X } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";

interface SermonCategory {
  id: string;
  name: string;
}

interface SermonTag {
  id: string;
  name: string;
  color: string;
}

interface Sermon {
  id: string;
  title: string;
  description: string | null;
  speaker: string;
  sermonDate: Date;
  categoryId: string | null;
  platform: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number | null;
  status: string;
  isFeatured: boolean;
  tags: SermonTag[];
}

const sermonFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  speaker: z.string().min(1, "Speaker name is required"),
  sermonDate: z.string().min(1, "Sermon date is required"),
  categoryId: z.string().optional(),
  platform: z.enum(["YouTube", "Vimeo", "Facebook", "Upload"]),
  videoUrl: z.string().url("Please enter a valid URL"),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  duration: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]),
  isFeatured: z.boolean().default(false),
});

type SermonFormValues = z.infer<typeof sermonFormSchema>;

export default function SermonFormPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/dashboard/sermons/:id/edit");
  const { toast } = useToast();
  const isEditing = !!params?.id;
  const sermonId = params?.id;

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [generatingDescription, setGeneratingDescription] = useState(false);

  const { data: session } = useQuery<{ user: { orgId: string } }>({
    queryKey: ["/api/auth/session"],
  });

  const orgId = session?.user?.orgId;

  const { data: categories } = useQuery<SermonCategory[]>({
    queryKey: ["/api/org", orgId, "sermon-categories"],
    enabled: !!orgId,
  });

  const { data: tags } = useQuery<SermonTag[]>({
    queryKey: ["/api/org", orgId, "sermon-tags"],
    enabled: !!orgId,
  });

  const { data: sermon, isLoading: sermonLoading } = useQuery<Sermon>({
    queryKey: ["/api/org", orgId, "sermons", sermonId],
    enabled: isEditing && !!orgId,
  });

  const form = useForm<SermonFormValues>({
    resolver: zodResolver(sermonFormSchema),
    defaultValues: {
      title: "",
      description: "",
      speaker: "",
      sermonDate: new Date().toISOString().split("T")[0],
      categoryId: "",
      platform: "YouTube",
      videoUrl: "",
      thumbnailUrl: "",
      duration: "",
      status: "draft",
      isFeatured: false,
    },
  });

  useEffect(() => {
    if (sermon && isEditing) {
      form.reset({
        title: sermon.title,
        description: sermon.description || "",
        speaker: sermon.speaker,
        sermonDate: new Date(sermon.sermonDate).toISOString().split("T")[0],
        categoryId: sermon.categoryId || "",
        platform: sermon.platform as "YouTube" | "Vimeo" | "Facebook" | "Upload",
        videoUrl: sermon.videoUrl,
        thumbnailUrl: sermon.thumbnailUrl || "",
        duration: sermon.duration?.toString() || "",
        status: sermon.status as "draft" | "published" | "archived",
        isFeatured: sermon.isFeatured,
      });
      if (sermon.tags) {
        setSelectedTags(sermon.tags.map((t: any) => t.id));
      }
    }
  }, [sermon, isEditing]);

  const saveMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      speaker: string;
      sermonDate: string;
      categoryId?: string;
      platform: string;
      videoUrl: string;
      thumbnailUrl?: string;
      duration?: number;
      status: string;
      isFeatured: boolean;
      tagIds?: string[];
    }) => {
      if (isEditing) {
        return await apiRequest("PATCH", `/api/org/${orgId}/sermons/${sermonId}`, data);
      } else {
        return await apiRequest("POST", `/api/org/${orgId}/sermons`, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org", orgId, "sermons"] });
      toast({
        title: "Success",
        description: `Sermon ${isEditing ? "updated" : "created"} successfully`,
      });
      navigate("/dashboard/sermons");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save sermon",
        variant: "destructive",
      });
    },
  });

  const generateDescriptionMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type: "sermon" }),
      });
      if (!response.ok) throw new Error("Failed to generate description");
      return await response.json();
    },
    onSuccess: (data) => {
      form.setValue("description", data.description);
      toast({ title: "Description generated successfully" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate description",
        variant: "destructive",
      });
    },
  });

  const handleGenerateDescription = () => {
    const title = form.getValues("title");
    if (!title) {
      toast({
        title: "Title required",
        description: "Please enter a sermon title first",
        variant: "destructive",
      });
      return;
    }
    setGeneratingDescription(true);
    generateDescriptionMutation.mutate(title, {
      onSettled: () => setGeneratingDescription(false),
    });
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const onSubmit = (data: SermonFormValues) => {
    const durationInSeconds = data.duration ? parseInt(data.duration, 10) : undefined;
    // Convert date string to ISO string for the API
    const sermonDate = data.sermonDate ? new Date(data.sermonDate).toISOString() : new Date().toISOString();
    
    saveMutation.mutate({
      title: data.title,
      description: data.description,
      speaker: data.speaker,
      sermonDate: sermonDate,
      categoryId: data.categoryId || undefined,
      platform: data.platform,
      videoUrl: data.videoUrl,
      thumbnailUrl: data.thumbnailUrl || undefined,
      duration: durationInSeconds,
      status: data.status,
      isFeatured: data.isFeatured,
      tagIds: selectedTags,
    });
  };

  if (isEditing && sermonLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <Breadcrumbs 
        items={[
          { label: "Sermons", href: "/dashboard/sermons" },
          { label: isEditing ? "Edit Sermon" : "Add Sermon" }
        ]} 
      />

      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/dashboard/sermons")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{isEditing ? "Edit Sermon" : "Add New Sermon"}</h1>
          <p className="text-muted-foreground mt-1">
            {isEditing ? "Update sermon details" : "Add a sermon to your media library"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the core details about this sermon</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Walking in Faith"
                        {...field}
                        data-testid="input-title"
                      />
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
                    <div className="flex gap-2">
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of the sermon message..."
                          rows={4}
                          {...field}
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGenerateDescription}
                        disabled={generatingDescription}
                        data-testid="button-generate-description"
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormDescription>
                      Click the sparkle icon to generate an AI-powered description
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="speaker"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Speaker</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Speaker name"
                          {...field}
                          data-testid="input-speaker"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sermonDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sermon Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          data-testid="input-sermon-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "none" ? "" : value)} 
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select a category (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Category</SelectItem>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Tags</FormLabel>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags?.map((tag) => {
                    const isSelected = selectedTags.includes(tag.id);
                    return (
                      <Badge
                        key={tag.id}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer hover-elevate active-elevate-2"
                        onClick={() => toggleTag(tag.id)}
                        data-testid={`badge-tag-${tag.id}`}
                      >
                        {tag.name}
                        {isSelected && <X className="h-3 w-3 ml-1" />}
                      </Badge>
                    );
                  })}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Click tags to select/deselect
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Video Details</CardTitle>
              <CardDescription>Add the video source and platform information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-platform">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="YouTube">YouTube</SelectItem>
                        <SelectItem value="Vimeo">Vimeo</SelectItem>
                        <SelectItem value="Facebook">Facebook</SelectItem>
                        <SelectItem value="Upload">Direct Upload</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://www.youtube.com/watch?v=..."
                        {...field}
                        data-testid="input-video-url"
                      />
                    </FormControl>
                    <FormDescription>
                      Full URL to the video on {form.watch("platform")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="thumbnailUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thumbnail URL (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://..."
                        {...field}
                        data-testid="input-thumbnail-url"
                      />
                    </FormControl>
                    <FormDescription>
                      Custom thumbnail image URL (auto-detected if left blank)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (seconds)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="3600"
                        {...field}
                        data-testid="input-duration"
                      />
                    </FormControl>
                    <FormDescription>
                      Duration in seconds (e.g., 3600 for 1 hour)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publishing Options</CardTitle>
              <CardDescription>Control how this sermon appears</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-featured"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Feature this sermon</FormLabel>
                      <FormDescription>
                        Featured sermons appear at the top of the library
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/sermons")}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              data-testid="button-submit"
            >
              {saveMutation.isPending ? "Saving..." : isEditing ? "Update Sermon" : "Add Sermon"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
