import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Video, Coins, Users, Eye, Calendar, ExternalLink, Edit } from "lucide-react";
import { format } from "date-fns";

interface Livestream {
  id: string;
  title: string;
  description: string;
  platform: string;
  videoId: string;
  embedUrl: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart: string | null;
  actualEnd: string | null;
  status: string;
  totalRaised: string;
  donorCount: number;
  viewCount: number;
  isPaid: boolean;
  ticketPrice: string;
  currency: string;
  replayAvailable: boolean;
}

interface LivestreamDonation {
  id: string;
  donorName: string;
  amount: string;
  category?: string;
  message: string;
  createdAt: string;
}

export default function ManageLivestreamPage() {
  const { id } = useParams();

  const { data: livestream, isLoading } = useQuery<Livestream>({
    queryKey: [`/api/livestreams/${id}`],
    enabled: !!id,
  });

  const { data: donations = [] } = useQuery<LivestreamDonation[]>({
    queryKey: [`/api/livestreams/${id}/donations`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <Skeleton className="h-12 w-1/2" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!livestream) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[400px]">
        <Card>
          <CardHeader>
            <CardTitle>Livestream Not Found</CardTitle>
            <CardDescription>
              The livestream you're looking for doesn't exist.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const statusColors = {
    scheduled: "bg-blue-500",
    live: "bg-red-500",
    ended: "bg-gray-500",
  };

  const statusLabels = {
    scheduled: "Scheduled",
    live: "LIVE",
    ended: "Ended",
  };

  const platformLabels = {
    youtube: "YouTube Live",
    facebook: "Facebook Live",
    custom: "Custom Stream",
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/dashboard/livestreams">
            <Button variant="outline" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-livestream-title">
                {livestream.title}
              </h1>
              <Badge 
                className={`${statusColors[livestream.status as keyof typeof statusColors]} text-white`}
                data-testid="badge-status"
              >
                {statusLabels[livestream.status as keyof typeof statusLabels]}
              </Badge>
            </div>
            <p className="text-muted-foreground max-w-xl">{livestream.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/livestreams/${livestream.id}`}>
            <Button variant="outline" data-testid="button-view-public">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Public Page
            </Button>
          </Link>
          <Link href={`/dashboard/livestreams/${livestream.id}/edit`}>
            <Button data-testid="button-edit">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="flex flex-col">
          <CardHeader className="pb-2 flex-none">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Raised
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold" data-testid="text-total-raised">
                {livestream.currency} {(parseFloat(livestream.totalRaised || "0") || 0).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="pb-2 flex-none">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Donors
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold" data-testid="text-donor-count">
                {livestream.donorCount}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="pb-2 flex-none">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Views
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold" data-testid="text-view-count">
                {livestream.viewCount}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="pb-2 flex-none">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Platform
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {platformLabels[livestream.platform as keyof typeof platformLabels]}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details" data-testid="tab-details">
            Details
          </TabsTrigger>
          <TabsTrigger value="donations" data-testid="tab-donations">
            Donations ({donations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Schedule Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Scheduled Start</p>
                  <p className="text-base font-medium">
                    {livestream.scheduledStart 
                      ? format(new Date(livestream.scheduledStart), "PPp")
                      : "Not set"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Scheduled End</p>
                  <p className="text-base font-medium">
                    {livestream.scheduledEnd
                      ? format(new Date(livestream.scheduledEnd), "PPp")
                      : "Not set"}
                  </p>
                </div>
              </div>

              {livestream.actualStart && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 mt-6 border-t">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Actual Start</p>
                    <p className="text-base font-medium">
                      {format(new Date(livestream.actualStart), "PPp")}
                    </p>
                  </div>
                  {livestream.actualEnd && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Actual End</p>
                      <p className="text-base font-medium">
                        {format(new Date(livestream.actualEnd), "PPp")}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {livestream.isPaid && (
            <Card>
              <CardHeader>
                <CardTitle>Ticketed Access</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ticket Price</p>
                    <p className="text-2xl font-bold">
                      {livestream.currency} {parseFloat(livestream.ticketPrice).toFixed(2)}
                    </p>
                  </div>
                  <Badge variant="default">Paid Event</Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="donations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Donations</CardTitle>
              <CardDescription>
                Complete list of donations received during this livestream
              </CardDescription>
            </CardHeader>
            <CardContent>
              {donations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No donations yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {donations.map((donation) => (
                    <div
                      key={donation.id}
                      className="p-4 rounded-lg border bg-card"
                      data-testid={`donation-${donation.id}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{donation.donorName}</p>
                            {donation.category && (
                              <Badge variant="secondary" className="text-xs">
                                {donation.category}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(donation.createdAt), "PPp")}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-primary">
                          {livestream.currency} {parseFloat(donation.amount).toFixed(2)}
                        </p>
                      </div>
                      {donation.message && (
                        <p className="text-sm text-muted-foreground italic">
                          "{donation.message}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
