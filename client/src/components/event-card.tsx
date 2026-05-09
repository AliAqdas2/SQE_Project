import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock, Settings } from "lucide-react";
import { Link } from "wouter";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  capacity: number;
  price?: number;
  imageUrl: string;
  status?: "upcoming" | "sold-out" | "ended";
}

export function EventCard({
  id,
  title,
  date,
  time,
  location,
  attendees,
  capacity,
  price,
  imageUrl,
  status = "upcoming",
}: EventCardProps) {
  const { formatCurrency } = useOrganizationLocale();
  const spotsLeft = capacity - attendees;

  return (
    <Card className="overflow-hidden hover-elevate">
      <div className="relative h-40 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3">
          {status === "sold-out" && (
            <Badge variant="destructive">Sold Out</Badge>
          )}
          {status === "upcoming" && (
            <Badge className="bg-green-600 dark:bg-green-700 text-white border-0">Upcoming</Badge>
          )}
          {status === "ended" && (
            <Badge variant="secondary">Ended</Badge>
          )}
        </div>
      </div>
      
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl leading-tight line-clamp-2">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{time}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{location}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {attendees} / {capacity} attending
              {spotsLeft > 0 && spotsLeft < 10 && (
                <span className="text-orange-600 ml-1">
                  • Only {spotsLeft} spots left
                </span>
              )}
            </span>
          </div>
        </div>
        
        {price !== undefined && (
          <div className="pt-2">
            <p className="text-2xl font-bold">
              {price === 0 ? "Free" : formatCurrency(price)}
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex gap-2">
        <Link href={`/dashboard/events/${id}/manage`} className="flex-1">
          <Button 
            variant="outline"
            className="w-full"
            data-testid="button-manage-event"
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage
          </Button>
        </Link>
        <Link href={`/events/${id}/register`} className="flex-1">
          <Button 
            className="w-full" 
            disabled={status === "sold-out"}
            data-testid="button-view-event"
          >
            View Event
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
