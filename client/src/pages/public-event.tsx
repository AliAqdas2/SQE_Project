import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock, Share2, Ticket, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Event, EventTicketType } from "@shared/schema";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";

type PublicEvent = Event & {
  registrationCount?: number;
  spotsLeft?: number;
  organizationReligion?: string | null;
};

export default function PublicEventPage() {
  const [, params] = useRoute("/events/:eventId");
  const eventId = params?.eventId || "";
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // All hooks must be called before any early returns
  const { formatCurrency } = useOrganizationLocale();

  const { data: event, isLoading: eventLoading } = useQuery<PublicEvent>({
    queryKey: [`/api/events/public/${eventId}`],
    enabled: !!eventId,
  });

  const { data: ticketTypes = [] } = useQuery<EventTicketType[]>({
    queryKey: [`/api/events/${eventId}/ticket-types`],
    enabled: !!eventId,
  });

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title,
          text: event?.description || "Check out this event!",
          url,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied",
        description: "Event link copied to clipboard!",
      });
    }
  };

  const handleRegister = () => {
    navigate(`/events/${eventId}/register`);
  };

  if (eventLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
          <p className="text-muted-foreground">This event may have been removed or the link is incorrect.</p>
        </div>
      </div>
    );
  }

  // Filter available ticket types
  const now = new Date();
  const availableTickets = ticketTypes.filter(ticket => {
    if (!ticket.isActive) return false;
    if (ticket.sold >= ticket.quantity) return false;
    
    // Check sale start date
    if (ticket.salesStart) {
      const salesStart = new Date(ticket.salesStart);
      if (now < salesStart) return false;
    }
    
    // Check sale end date
    if (ticket.salesEnd) {
      const salesEnd = new Date(ticket.salesEnd);
      if (now > salesEnd) return false;
    }
    
    return true;
  });

  // Calculate pricing info
  const lowestPrice = availableTickets.length > 0
    ? Math.min(...availableTickets.map(t => parseFloat(t.price)))
    : parseFloat(event.price);
  const highestPrice = availableTickets.length > 0
    ? Math.max(...availableTickets.map(t => parseFloat(t.price)))
    : parseFloat(event.price);
  const isFree = lowestPrice === 0 && highestPrice === 0;
  const hasPriceRange = lowestPrice !== highestPrice;

  const spotsLeft = event.spotsLeft ?? (event.capacity - event.attendeeCount);
  const isSoldOut = spotsLeft <= 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      {event.imageUrl && (
        <div className="relative h-96 overflow-hidden">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" data-testid="text-event-title">
                {event.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/90">
                <Badge className="bg-white/20 text-white hover:bg-white/30">
                  {event.eventType.replace("-", " ").toUpperCase()}
                </Badge>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {new Date(event.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {event.time}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Event Details
                  <Button variant="outline" size="sm" onClick={handleShare} data-testid="button-share">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 mt-1 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-muted-foreground">{event.location}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Capacity</p>
                    <p className="text-muted-foreground">
                      {event.attendeeCount} / {event.capacity} registered
                      {!isSoldOut && (
                        <span className="text-primary ml-2">
                          ({spotsLeft} {spotsLeft === 1 ? "spot" : "spots"} left)
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {event.description && (
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-2">About This Event</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Tickets */}
            {availableTickets.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Available Tickets</CardTitle>
                  <CardDescription>Choose your ticket type when registering</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {availableTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Ticket className="h-5 w-5" />
                            <h4 className="font-semibold">{ticket.name}</h4>
                          </div>
                          {ticket.description && (
                            <p className="text-sm text-muted-foreground mb-2">{ticket.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">
                              {ticket.quantity - ticket.sold} available
                            </span>
                            {ticket.minPerOrder > 1 && (
                              <span className="text-muted-foreground">Min: {ticket.minPerOrder}</span>
                            )}
                            {ticket.maxPerOrder < 100 && (
                              <span className="text-muted-foreground">Max: {ticket.maxPerOrder}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {parseFloat(ticket.price) === 0 ? (
                              "Free"
                            ) : (
                              formatCurrency(parseFloat(ticket.price), event.currency)
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Registration Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Register Now</CardTitle>
                <CardDescription>Secure your spot at this event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pricing Info */}
                <div className="bg-muted p-4 rounded-lg text-center">
                  {isFree ? (
                    <div>
                      <span className="text-3xl font-bold text-green-600">Free</span>
                      <p className="text-sm text-muted-foreground mt-1">No payment required</p>
                    </div>
                  ) : hasPriceRange ? (
                    <div>
                      <span className="text-lg text-muted-foreground">From</span>
                      <span className="text-3xl font-bold ml-2">
                        {formatCurrency(lowestPrice, event.currency)}
                      </span>
                      <p className="text-sm text-muted-foreground mt-1">
                        Tickets from {formatCurrency(lowestPrice, event.currency)} to {formatCurrency(highestPrice, event.currency)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold">
                        {formatCurrency(lowestPrice, event.currency)}
                      </span>
                      <p className="text-sm text-muted-foreground mt-1">per ticket</p>
                    </div>
                  )}
                </div>

                {/* Event Quick Info */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(event.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {event.time && ` at ${event.time}`}
                    </span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {isSoldOut ? (
                        <span className="text-destructive font-medium">Sold Out</span>
                      ) : (
                        <>{spotsLeft} {spotsLeft === 1 ? "spot" : "spots"} remaining</>
                      )}
                    </span>
                  </div>
                </div>

                {/* Register Button */}
                {isSoldOut ? (
                  <Button
                    className="w-full"
                    size="lg"
                    disabled
                    data-testid="button-register"
                  >
                    Sold Out
                  </Button>
                ) : (
                  <Button
                    onClick={handleRegister}
                    className="w-full"
                    size="lg"
                    data-testid="button-register"
                  >
                    Register Now
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}

                {!isSoldOut && (
                  <p className="text-xs text-center text-muted-foreground">
                    You'll be taken to the registration form with payment options
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
