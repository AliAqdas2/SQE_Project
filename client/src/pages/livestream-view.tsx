import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LivestreamDonationPanel } from "@/components/livestream-donation-panel";
import { LivestreamChat } from "@/components/livestream-chat";
import { Video, Users, Coins, Calendar } from "lucide-react";
import { format } from "date-fns";

interface PublicLivestream {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  platform: string;
  videoId: string;
  embedUrl: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  totalRaised: string;
  donorCount: number;
  viewCount: number;
  isPaid: boolean;
  ticketPrice: string | null;
  currency: string;
  organizationReligion?: string | null;
  organizationCountry?: string | null;
  organizationSettings?: { giftAidPercentage?: number } | null;
  recentDonations: Array<{
    donorName: string;
    amount: string;
    message: string;
    createdAt: string;
  }>;
}

export default function LivestreamView() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  
  const { data: livestream, isLoading } = useQuery<PublicLivestream>({
    queryKey: [`/api/livestreams/public/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="aspect-video w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!livestream) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Livestream Not Found</CardTitle>
            <CardDescription>
              This livestream is not available or has not started yet.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const getEmbedUrl = () => {
    if (livestream.platform === "youtube") {
      return `https://www.youtube.com/embed/${livestream.videoId}?autoplay=1`;
    } else if (livestream.platform === "facebook") {
      return `https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/facebook/videos/${livestream.videoId}/&autoplay=1`;
    } else {
      return livestream.embedUrl;
    }
  };

  const statusColors = {
    scheduled: "bg-blue-500",
    live: "bg-red-500 animate-pulse",
    ended: "bg-gray-500",
  };

  const statusLabels = {
    scheduled: "Scheduled",
    live: "LIVE",
    ended: "Ended",
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold" data-testid="text-livestream-title">
              {livestream.title}
            </h1>
            <Badge 
              className={`${statusColors[livestream.status as keyof typeof statusColors]} text-white`}
              data-testid={`badge-status-${livestream.status}`}
            >
              {statusLabels[livestream.status as keyof typeof statusLabels]}
            </Badge>
          </div>
          <p className="text-muted-foreground" data-testid="text-livestream-description">
            {livestream.description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-black rounded-lg overflow-hidden" data-testid="video-player">
                  <iframe
                    src={getEmbedUrl()}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </CardContent>
            </Card>

            {/* Stream Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Scheduled Start</p>
                    <p className="font-medium" data-testid="text-scheduled-start">
                      {format(new Date(livestream.scheduledStart), "PPp")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Scheduled End</p>
                    <p className="font-medium" data-testid="text-scheduled-end">
                      {format(new Date(livestream.scheduledEnd), "PPp")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                      <Coins className="h-4 w-4" />
                      <span className="text-sm">Raised</span>
                    </div>
                    <p className="text-2xl font-bold" data-testid="text-total-raised">
                      {livestream.currency} {parseFloat(livestream.totalRaised).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">Donors</span>
                    </div>
                    <p className="text-2xl font-bold" data-testid="text-donor-count">
                      {livestream.donorCount}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                      <Video className="h-4 w-4" />
                      <span className="text-sm">Views</span>
                    </div>
                    <p className="text-2xl font-bold" data-testid="text-view-count">
                      {livestream.viewCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Donations & Chat */}
          <div className="space-y-6">
            <Tabs defaultValue="donations" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="donations" data-testid="tab-donations">
                  Donations
                </TabsTrigger>
                <TabsTrigger value="chat" data-testid="tab-chat">
                  Chat
                </TabsTrigger>
              </TabsList>
              <TabsContent value="donations" className="mt-6">
                <LivestreamDonationPanel
                  livestreamId={livestream.id}
                  currency={livestream.currency}
                  organizationReligion={livestream.organizationReligion}
                  organizationCountry={livestream.organizationCountry || undefined}
                  organizationSettings={livestream.organizationSettings || undefined}
                  recentDonations={livestream.recentDonations}
                />
              </TabsContent>
              <TabsContent value="chat" className="mt-6 h-[600px]">
                <LivestreamChat livestreamId={livestream.id} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
