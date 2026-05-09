import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Video, Plus, Calendar, Coins, Users, Eye } from "lucide-react";
import { format } from "date-fns";

interface Livestream {
  id: string;
  title: string;
  description: string;
  platform: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  totalRaised: string;
  donorCount: number;
  viewCount: number;
  isPaid: boolean;
  ticketPrice: string;
  currency: string;
}

interface User {
  id: string;
  orgId: string;
  orgSlug: string;
}

interface SessionResponse {
  user: User;
}

export default function LivestreamsPage() {
  const { data: sessionData } = useQuery<SessionResponse>({
    queryKey: ["/api/auth/session"],
  });
  
  const user = sessionData?.user;

  const { data: livestreams, isLoading } = useQuery<Livestream[]>({
    queryKey: ["/api/livestreams", { orgId: user?.orgId || "" }],
    enabled: !!user?.orgId,
  });

  const livestreamList = livestreams || [];

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

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-10 md:w-40" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header - Compact for mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold truncate">Livestreams</h1>
          <p className="text-sm md:text-base text-muted-foreground hidden sm:block">
            Manage your live streaming events and donations
          </p>
        </div>
        <Link href="/dashboard/livestreams/create">
          <Button data-testid="button-create-livestream" className="w-full sm:w-auto shrink-0">
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Create Livestream</span>
          </Button>
        </Link>
      </div>

      {/* Livestreams Grid */}
      {livestreamList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 md:py-16 px-4">
            <Video className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-center">No Livestreams Yet</h3>
            <p className="text-sm md:text-base text-muted-foreground text-center mb-6 max-w-md">
              Start engaging with your community through live streaming. Create your first livestream to begin collecting donations in real-time.
            </p>
            <Link href="/dashboard/livestreams/create">
              <Button data-testid="button-create-first-livestream" size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Livestream
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {livestreamList.map((livestream) => (
            <Card key={livestream.id} className="hover-elevate flex flex-col" data-testid={`card-livestream-${livestream.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <CardTitle className="line-clamp-2 text-lg md:text-xl" data-testid={`text-title-${livestream.id}`}>
                    {livestream.title}
                  </CardTitle>
                  <Badge 
                    className={`${statusColors[livestream.status as keyof typeof statusColors]} text-white shrink-0`}
                    data-testid={`badge-status-${livestream.id}`}
                  >
                    {statusLabels[livestream.status as keyof typeof statusLabels]}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 text-sm" data-testid={`text-description-${livestream.id}`}>
                  {livestream.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 flex flex-col">
                {/* Platform & Schedule */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Video className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{platformLabels[livestream.platform as keyof typeof platformLabels]}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span className="truncate">{format(new Date(livestream.scheduledStart), "PPp")}</span>
                  </div>
                </div>

                {/* Stats - More compact on mobile */}
                <div className="grid grid-cols-3 gap-2 py-3 border-t border-b">
                  <div className="text-center min-w-0">
                    <Coins className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs md:text-sm font-bold truncate" data-testid={`text-raised-${livestream.id}`}>
                      {livestream.currency} {parseFloat(livestream.totalRaised).toFixed(0)}
                    </p>
                  </div>
                  <div className="text-center min-w-0">
                    <Users className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs md:text-sm font-bold">{livestream.donorCount}</p>
                  </div>
                  <div className="text-center min-w-0">
                    <Eye className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs md:text-sm font-bold">{livestream.viewCount}</p>
                  </div>
                </div>

                {/* Actions - Better touch targets */}
                <div className="flex gap-2 mt-auto">
                  <Link href={`/dashboard/livestreams/${livestream.id}/manage`} className="flex-1">
                    <Button variant="outline" className="w-full h-10 md:h-9" data-testid={`button-manage-${livestream.id}`}>
                      Manage
                    </Button>
                  </Link>
                  <Link href={`/livestreams/${livestream.id}`} className="flex-1">
                    <Button variant="default" className="w-full h-10 md:h-9" data-testid={`button-view-${livestream.id}`}>
                      View Live
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
