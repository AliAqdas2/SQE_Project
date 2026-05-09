import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, X } from "lucide-react";
import { EventCard } from "@/components/event-card";
import { Link } from "wouter";
import type { Event } from "@shared/schema";

type EventType = "all" | "in-person" | "virtual" | "hybrid";
type EventStatus = "all" | "draft" | "upcoming" | "sold-out" | "ended";
type PriceFilter = "all" | "free" | "paid";

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [eventType, setEventType] = useState<EventType>("all");
  const [eventStatus, setEventStatus] = useState<EventStatus>("all");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [category, setCategory] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Get current user to retrieve orgId
  const { data: session } = useQuery<{ user: { orgId: string } }>({
    queryKey: ["/api/auth/session"],
  });

  const orgId = session?.user?.orgId;

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", orgId],
    queryFn: async () => {
      const res = await fetch(`/api/events?orgId=${orgId}`);
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
    enabled: !!orgId,
  });

  const filteredEvents = useMemo(() => {
    if (!events) return [];

    return events.filter((event) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          event.title.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.location?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Event type filter
      if (eventType !== "all" && event.eventType !== eventType) {
        return false;
      }

      // Status filter
      if (eventStatus !== "all" && event.status !== eventStatus) {
        return false;
      }

      // Price filter
      if (priceFilter !== "all") {
        const isFree = parseFloat(event.price) === 0;
        if (priceFilter === "free" && !isFree) return false;
        if (priceFilter === "paid" && isFree) return false;
      }

      // Category filter
      if (category !== "all" && event.category !== category) {
        return false;
      }

      // Date range filter
      if (dateFrom || dateTo) {
        const eventDate = new Date(event.date).getTime();
        if (dateFrom) {
          const fromTime = new Date(dateFrom).getTime();
          if (eventDate < fromTime) return false;
        }
        if (dateTo) {
          // Add one day to get midnight of next day, then exclude events on or after that
          const toTime = new Date(dateTo).getTime() + 86400000;
          if (eventDate >= toTime) return false;
        }
      }

      return true;
    });
  }, [events, searchQuery, eventType, eventStatus, priceFilter, category, dateFrom, dateTo]);

  const activeFiltersCount = [
    eventType !== "all",
    eventStatus !== "all",
    priceFilter !== "all",
    category !== "all",
    !!dateFrom,
    !!dateTo,
  ].filter(Boolean).length;

  const categories = useMemo(() => {
    if (!events) return [];
    const uniqueCategories = new Set(events.map(e => e.category).filter(Boolean));
    return Array.from(uniqueCategories);
  }, [events]);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const clearFilters = () => {
    setEventType("all");
    setEventStatus("all");
    setPriceFilter("all");
    setCategory("all");
    setDateFrom("");
    setDateTo("");
    setSearchQuery("");
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Events</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage your events and ticketing
          </p>
        </div>
        <Link href="/dashboard/events/create">
          <Button className="w-full sm:w-auto" data-testid="button-create-event">
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events by title, description, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-events"
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-toggle-filters"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Event Type</label>
              <Select value={eventType} onValueChange={(value) => setEventType(value as EventType)}>
                <SelectTrigger data-testid="select-event-type-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="in-person">In-Person</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={eventStatus} onValueChange={(value) => setEventStatus(value as EventStatus)}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="sold-out">Sold Out</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Price</label>
              <Select value={priceFilter} onValueChange={(value) => setPriceFilter(value as PriceFilter)}>
                <SelectTrigger data-testid="select-price-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {categories.length > 0 && (
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger data-testid="select-category-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat!}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Date From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                data-testid="input-date-from"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Date To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                data-testid="input-date-to"
              />
            </div>

            {activeFiltersCount > 0 && (
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  data-testid="button-clear-filters"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {events && events.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredEvents.length} of {events.length} events
            </p>
          </div>

          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  title={event.title}
                  date={new Date(event.date).toLocaleDateString()}
                  time={event.time}
                  location={event.location}
                  attendees={event.attendeeCount}
                  capacity={event.capacity}
                  price={parseFloat(event.price)}
                  imageUrl={event.imageUrl ?? ""}
                  status={(event.status as "upcoming" | "sold-out" | "ended") ?? "upcoming"}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No events match your filters</p>
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No events yet</p>
          <Link href="/dashboard/events/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Event
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
