import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Eye, Calendar, User, Tag, Play, Download, Share2 } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Sermon {
  id: string;
  orgId: string;
  title: string;
  description: string | null;
  speaker: string;
  sermonDate: string | Date;
  categoryId: string | null;
  platform: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number | null;
  views: number;
  status: string;
  isFeatured: boolean;
  aiNotes: any;
  tags: Array<{ id: string; name: string; color: string }>;
}

export default function SermonDetailPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/dashboard/sermons/:id");
  const { toast } = useToast();
  const sermonId = params?.id;

  const { data: session } = useQuery<{ user: { orgId: string } }>({
    queryKey: ["/api/auth/session"],
  });

  const orgId = session?.user?.orgId;

  const { data: sermon, isLoading } = useQuery<Sermon>({
    queryKey: ["/api/org", orgId, "sermons", sermonId],
    enabled: !!sermonId && !!orgId,
  });

  const incrementViewMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/org/${orgId}/sermons/${sermonId}/view`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org", orgId, "sermons", sermonId] });
    },
  });

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: sermon?.title,
        text: sermon?.description || "",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied to clipboard" });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="aspect-video bg-muted rounded" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!sermon) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Sermon not found</p>
            <Button onClick={() => navigate("/dashboard/sermons")} className="mt-4" data-testid="button-back-not-found">
              Back to Sermons
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <Breadcrumbs 
        items={[
          { label: "Sermons", href: "/dashboard/sermons" },
          { label: sermon.title }
        ]} 
      />

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/dashboard/sermons")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sermons
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleShare} data-testid="button-share">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button onClick={() => navigate(`/dashboard/sermons/${sermon.id}/edit`)} data-testid="button-edit">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-0">
              <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
                {sermon.platform === "YouTube" && sermon.videoUrl.includes("youtube.com") ? (
                  <iframe
                    src={sermon.videoUrl.replace("watch?v=", "embed/")}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    data-testid="iframe-youtube-player"
                    onLoad={() => incrementViewMutation.mutate()}
                  />
                ) : sermon.platform === "Vimeo" && sermon.videoUrl.includes("vimeo.com") ? (
                  <iframe
                    src={sermon.videoUrl.replace("vimeo.com/", "player.vimeo.com/video/")}
                    className="w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    data-testid="iframe-vimeo-player"
                    onLoad={() => incrementViewMutation.mutate()}
                  />
                ) : sermon.thumbnailUrl ? (
                  <img src={sermon.thumbnailUrl} alt={sermon.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="h-16 w-16 text-white/50" />
                  </div>
                )}
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h1 className="text-2xl font-bold" data-testid="text-sermon-title">
                      {sermon.title}
                    </h1>
                    {sermon.isFeatured && (
                      <Badge className="bg-yellow-500 hover:bg-yellow-500 text-white">
                        Featured
                      </Badge>
                    )}
                  </div>
                  {sermon.description && (
                    <p className="text-muted-foreground" data-testid="text-sermon-description">
                      {sermon.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span data-testid="text-speaker">{sermon.speaker}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span data-testid="text-sermon-date">{formatDate(sermon.sermonDate)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span data-testid="text-view-count">{(sermon.views || 0).toLocaleString()} views</span>
                  </div>
                  {sermon.duration && (
                    <div className="flex items-center gap-1">
                      <Play className="h-4 w-4" />
                      <span>{formatDuration(sermon.duration)}</span>
                    </div>
                  )}
                </div>

                {sermon.tags && sermon.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {sermon.tags.map((tag) => (
                      <Badge key={tag.id} variant="outline" data-testid={`badge-tag-${tag.id}`}>
                        <Tag className="h-3 w-3 mr-1" />
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" asChild data-testid="button-watch-original">
                    <a href={sermon.videoUrl} target="_blank" rel="noopener noreferrer">
                      <Play className="h-4 w-4 mr-2" />
                      Watch on {sermon.platform}
                    </a>
                  </Button>
                  <Button variant="outline" data-testid="button-download">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="notes" className="w-full" data-testid="tabs-sermon-content">
            <TabsList className="w-full grid grid-cols-2" data-testid="tabs-list-sermon-content">
              <TabsTrigger value="notes" data-testid="tab-notes">Notes & Insights</TabsTrigger>
              <TabsTrigger value="resources" data-testid="tab-resources">Resources</TabsTrigger>
            </TabsList>
            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle>Sermon Notes</CardTitle>
                  <CardDescription>Key points and insights from this message</CardDescription>
                </CardHeader>
                <CardContent>
                  {sermon.aiNotes ? (
                    <div className="prose dark:prose-invert max-w-none" data-testid="text-ai-notes">
                      {typeof sermon.aiNotes === 'string' ? (
                        <p>{sermon.aiNotes}</p>
                      ) : (
                        <pre className="whitespace-pre-wrap">{JSON.stringify(sermon.aiNotes, null, 2)}</pre>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No notes available for this sermon</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="resources">
              <Card>
                <CardHeader>
                  <CardTitle>Additional Resources</CardTitle>
                  <CardDescription>Study guides, transcripts, and related materials</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No additional resources available</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={sermon.status === "published" ? "default" : "secondary"}>
                  {sermon.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Platform</p>
                <p className="text-sm">{sermon.platform}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Duration</p>
                <p className="text-sm">{formatDuration(sermon.duration)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                <p className="text-sm">{(sermon.views || 0).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
