import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Play, Eye, Calendar, User, Tag } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";

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
  tags: Array<{ id: string; name: string; color: string }>;
}

interface SermonCategory {
  id: string;
  name: string;
  description: string | null;
}

export default function SermonsPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const { data: session } = useQuery<{ user: { orgId: string } }>({
    queryKey: ["/api/auth/session"],
  });

  const orgId = session?.user?.orgId;

  // Build query params for sermons
  const sermonsParams = new URLSearchParams();
  if (searchQuery) sermonsParams.append("search", searchQuery);
  if (selectedCategory !== "all") sermonsParams.append("categoryId", selectedCategory);
  if (selectedPlatform !== "all") sermonsParams.append("platform", selectedPlatform);
  if (selectedStatus !== "all") sermonsParams.append("status", selectedStatus);
  const sermonsQueryString = sermonsParams.toString();
  const sermonsUrl = `/api/org/${orgId}/sermons${sermonsQueryString ? `?${sermonsQueryString}` : ""}`;

  const { data: sermons, isLoading: sermonsLoading } = useQuery<Sermon[]>({
    queryKey: [sermonsUrl],
    enabled: !!orgId,
  });

  const { data: categories } = useQuery<SermonCategory[]>({
    queryKey: [`/api/org/${orgId}/sermon-categories`],
    enabled: !!orgId,
  });

  const filteredSermons = sermons || [];
  const featuredSermons = filteredSermons.filter((s) => s.isFeatured);
  const regularSermons = filteredSermons.filter((s) => !s.isFeatured);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getPlatformBadgeColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "youtube":
        return "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400";
      case "vimeo":
        return "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400";
      case "facebook":
        return "bg-blue-700/10 text-blue-700 dark:bg-blue-700/20 dark:text-blue-500";
      default:
        return "";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "published":
        return "default";
      case "draft":
        return "secondary";
      case "archived":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <Breadcrumbs items={[{ label: "Sermons & Media Library" }]} />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Sermons & Media Library</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Manage your sermon videos, audio recordings, and teaching resources
          </p>
        </div>
        <Button onClick={() => navigate("/dashboard/sermons/create")} data-testid="button-add-sermon" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Sermon
        </Button>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sermons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-sermons"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger data-testid="select-category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger data-testid="select-platform-filter">
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="YouTube">YouTube</SelectItem>
                <SelectItem value="Vimeo">Vimeo</SelectItem>
                <SelectItem value="Facebook">Facebook</SelectItem>
                <SelectItem value="Upload">Direct Upload</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {sermonsLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <div className="aspect-video bg-muted animate-pulse" />
              <CardContent className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredSermons.length > 0 ? (
        <div className="space-y-8">
          {featuredSermons.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Featured Sermons</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featuredSermons.map((sermon) => (
                  <Link key={sermon.id} href={`/dashboard/sermons/${sermon.id}`} data-testid={`link-sermon-${sermon.id}`}>
                    <Card className="hover-elevate active-elevate-2 overflow-hidden cursor-pointer" data-testid={`card-sermon-${sermon.id}`}>
                      <div className="relative aspect-video bg-muted">
                        {sermon.thumbnailUrl ? (
                          <img
                            src={sermon.thumbnailUrl}
                            alt={sermon.title}
                            className="w-full h-full object-cover"
                            data-testid={`img-sermon-thumbnail-${sermon.id}`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Badge className="bg-yellow-500/90 hover:bg-yellow-500 text-white">
                            Featured
                          </Badge>
                          <Badge className={getPlatformBadgeColor(sermon.platform)}>
                            {sermon.platform}
                          </Badge>
                        </div>
                        {sermon.duration && (
                          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                            {formatDuration(sermon.duration)}
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <h3 className="font-semibold line-clamp-2" data-testid={`text-sermon-title-${sermon.id}`}>
                            {sermon.title}
                          </h3>
                          {sermon.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {sermon.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{sermon.speaker}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(sermon.sermonDate)}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Eye className="h-3 w-3" />
                            <span data-testid={`text-view-count-${sermon.id}`}>{(sermon.views || 0).toLocaleString()} views</span>
                          </div>
                          <Badge variant={getStatusBadgeVariant(sermon.status)}>
                            {sermon.status}
                          </Badge>
                        </div>
                        {sermon.tags && sermon.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {sermon.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag.id} variant="outline" className="text-xs">
                                <Tag className="h-2 w-2 mr-1" />
                                {tag.name}
                              </Badge>
                            ))}
                            {sermon.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{sermon.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {regularSermons.length > 0 && (
            <div>
              {featuredSermons.length > 0 && <h2 className="text-xl font-semibold mb-4">All Sermons</h2>}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {regularSermons.map((sermon) => (
                  <Link key={sermon.id} href={`/dashboard/sermons/${sermon.id}`} data-testid={`link-sermon-${sermon.id}`}>
                    <Card className="hover-elevate active-elevate-2 overflow-hidden cursor-pointer" data-testid={`card-sermon-${sermon.id}`}>
                      <div className="relative aspect-video bg-muted">
                        {sermon.thumbnailUrl ? (
                          <img
                            src={sermon.thumbnailUrl}
                            alt={sermon.title}
                            className="w-full h-full object-cover"
                            data-testid={`img-sermon-thumbnail-${sermon.id}`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge className={getPlatformBadgeColor(sermon.platform)}>
                            {sermon.platform}
                          </Badge>
                        </div>
                        {sermon.duration && (
                          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                            {formatDuration(sermon.duration)}
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <h3 className="font-semibold line-clamp-2" data-testid={`text-sermon-title-${sermon.id}`}>
                            {sermon.title}
                          </h3>
                          {sermon.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {sermon.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{sermon.speaker}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(sermon.sermonDate)}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Eye className="h-3 w-3" />
                            <span data-testid={`text-view-count-${sermon.id}`}>{(sermon.views || 0).toLocaleString()} views</span>
                          </div>
                          <Badge variant={getStatusBadgeVariant(sermon.status)}>
                            {sermon.status}
                          </Badge>
                        </div>
                        {sermon.tags && sermon.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {sermon.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag.id} variant="outline" className="text-xs">
                                <Tag className="h-2 w-2 mr-1" />
                                {tag.name}
                              </Badge>
                            ))}
                            {sermon.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{sermon.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Play className="h-12 w-12 opacity-50 mb-4" />
            <p className="text-muted-foreground mb-4">No sermons found</p>
            <Button onClick={() => navigate("/dashboard/sermons/create")} data-testid="button-create-first-sermon">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Sermon
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
