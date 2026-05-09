import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Heart, Calendar, Users, Coins, MapPin, Clock, Video, BookOpen, HandHeart, MessageCircle, Info } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { AIAssistantChat } from "@/components/ai-assistant-chat";
import PublicPrayerWall from "@/components/public-prayer-wall";
import { getDonationCategories, getTaxReliefProgram } from "@shared/constants";

interface PublicLandingPageData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  heroImageUrl: string | null;
  bannerImageUrl: string | null;
  aboutUs: string | null;
  settings: {
    primaryColor?: string;
    secondaryColor?: string;
    showCampaigns?: boolean;
    showEvents?: boolean;
    showLivestreams?: boolean;
    showDonations?: boolean;
    showPrayerTimes?: boolean;
    showSermons?: boolean;
    showVolunteers?: boolean;
    showPrayerWall?: boolean;
    showActivities?: boolean;
    showChatbot?: boolean;
    moduleOrder?: string[];
  };
  organization: {
    id: string;
    name: string;
    logoUrl: string | null;
    religion?: string;
    country?: string;
  };
  campaigns: any[];
  events: any[];
  livestreams: any[];
  prayerTimes?: any;
  sermons: any[];
  volunteers: any[];
  activities: any[];
}

export default function PublicLandingPage() {
  const [, params] = useRoute("/p/:slug");
  const slug = params?.slug;
  const [donationAmount, setDonationAmount] = useState("");
  const [donationCategory, setDonationCategory] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  
  // Gift Aid / Tax Relief fields
  const [giftAidOptIn, setGiftAidOptIn] = useState(false);
  const [donorAddress, setDonorAddress] = useState("");
  const [donorCity, setDonorCity] = useState("");
  const [donorPostcode, setDonorPostcode] = useState("");

  const { data, isLoading, error } = useQuery<PublicLandingPageData>({
    queryKey: [`/api/public/landing-page/${slug}`],
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 space-y-8">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Page Not Found</h1>
          <p className="text-muted-foreground">
            The landing page you're looking for doesn't exist or is not published.
          </p>
        </div>
      </div>
    );
  }

  const { title, description, heroImageUrl, bannerImageUrl, aboutUs, organization, campaigns, events, livestreams, prayerTimes, sermons, volunteers, activities, settings } = data;
  const primaryColor = settings.primaryColor || "#00BCD4";
  const secondaryColor = settings.secondaryColor || "#FF5722";
  
  // Get donation categories based on organization religion
  const donationCategories = getDonationCategories(organization.religion);
  
  // Get tax relief program for organization's country
  const taxReliefProgram = getTaxReliefProgram(organization.country);

  return (
    <div className="min-h-screen bg-background">
      {/* Organization Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center space-y-4">
            {organization.logoUrl && (
              <img src={organization.logoUrl} alt={organization.name} className="h-20 w-auto" />
            )}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold">{organization.name}</h1>
          </div>
        </div>
      </div>

      {/* Banner Section */}
      {bannerImageUrl && (
        <div className="relative h-64 sm:h-80 md:h-96 bg-cover bg-center border-b" style={{ backgroundImage: `url(${bannerImageUrl})` }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/10" />
        </div>
      )}

      {/* About Us Section */}
      {aboutUs && (
        <div className="bg-muted/30 py-12 border-b">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-center">About Us</h2>
              <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">{aboutUs}</p>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12 space-y-16">
        {/* Campaigns Section */}
        {settings.showCampaigns !== false && campaigns && campaigns.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <Heart className="h-8 w-8" style={{ color: primaryColor }} />
              <h2 className="text-3xl font-bold">Active Campaigns</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => {
                const progress = (parseFloat(campaign.currentAmount) / parseFloat(campaign.goalAmount)) * 100;
                return (
                  <Link key={campaign.id} href={`/c/${campaign.slug || campaign.id}/${campaign.id}`}>
                    <Card className="h-full hover-elevate cursor-pointer">
                      {campaign.imageUrl && (
                        <img
                          src={campaign.imageUrl}
                          alt={campaign.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                      )}
                      <CardHeader>
                        <CardTitle>{campaign.title}</CardTitle>
                        {campaign.category && (
                          <Badge variant="secondary">{campaign.category}</Badge>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-semibold" style={{ color: primaryColor }}>
                              ${parseFloat(campaign.currentAmount).toLocaleString()}
                            </span>
                            <span className="text-muted-foreground">
                              of ${parseFloat(campaign.goalAmount).toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.min(progress, 100)}%`,
                                backgroundColor: primaryColor,
                              }}
                            />
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button className="w-full" style={{ backgroundColor: primaryColor }}>
                          <Coins className="h-4 w-4 mr-2" />
                          Donate Now
                        </Button>
                      </CardFooter>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Events Section */}
        {settings.showEvents !== false && events && events.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <Calendar className="h-8 w-8" style={{ color: primaryColor }} />
              <h2 className="text-3xl font-bold">Upcoming Events</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <Card className="hover-elevate cursor-pointer">
                    {event.imageUrl && (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    )}
                    <CardHeader>
                      <CardTitle>{event.title}</CardTitle>
                      <CardDescription className="flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(event.startDate).toLocaleDateString()}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </span>
                        )}
                        {event.attendeeCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {event.attendeeCount} registered
                          </span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    {event.description && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {event.description}
                        </p>
                      </CardContent>
                    )}
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        View Event Details
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Livestreams Section */}
        {settings.showLivestreams !== false && livestreams && livestreams.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <Video className="h-8 w-8" style={{ color: primaryColor }} />
              <h2 className="text-3xl font-bold">Live & Upcoming Streams</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {livestreams.map((livestream) => (
                <Link key={livestream.id} href={`/livestreams/${livestream.id}`}>
                  <Card className="hover-elevate cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{livestream.title}</CardTitle>
                        {livestream.status === 'live' && (
                          <Badge variant="destructive">Live</Badge>
                        )}
                        {livestream.status === 'upcoming' && (
                          <Badge variant="secondary">Upcoming</Badge>
                        )}
                      </div>
                      <CardDescription>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(livestream.scheduledStart).toLocaleString()}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    {livestream.description && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {livestream.description}
                        </p>
                      </CardContent>
                    )}
                    <CardFooter>
                      <Button
                        variant={livestream.status === 'live' ? 'default' : 'outline'}
                        className="w-full"
                        style={livestream.status === 'live' ? { backgroundColor: primaryColor } : {}}
                      >
                        {livestream.status === 'live' ? 'Watch Now' : 'View Details'}
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Quick Donate Panel */}
        {settings.showDonations !== false && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <Coins className="h-8 w-8" style={{ color: primaryColor }} />
              <h2 className="text-3xl font-bold">Support Our Mission</h2>
            </div>
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle>Make a Difference Today</CardTitle>
                <CardDescription>
                  Your generous contribution helps us continue our mission and serve the community
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Donation Category</label>
                  <Select value={donationCategory} onValueChange={setDonationCategory}>
                    <SelectTrigger data-testid="select-donation-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {donationCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Donation Amount</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      data-testid="input-donation-amount"
                    />
                    <span className="flex items-center px-3 bg-muted rounded-md text-sm">USD</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[25, 50, 100, 250, 500].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      onClick={() => setDonationAmount(amount.toString())}
                      data-testid={`button-quick-donate-${amount}`}
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>

                {/* Gift Aid / Tax Relief Section */}
                {taxReliefProgram && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="gift-aid-opt-in"
                        checked={giftAidOptIn}
                        onCheckedChange={(checked) => setGiftAidOptIn(checked as boolean)}
                        data-testid="checkbox-gift-aid"
                      />
                      <div className="flex-1">
                        <Label htmlFor="gift-aid-opt-in" className="text-sm font-medium leading-none cursor-pointer">
                          {taxReliefProgram.label}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {taxReliefProgram.description}
                          {taxReliefProgram.rate > 0 && (
                            <span className="font-medium"> (+{taxReliefProgram.rate}%)</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Show address fields if Gift Aid is checked */}
                    {giftAidOptIn && taxReliefProgram.requiresAddress && (
                      <div className="space-y-3 pl-7">
                        <div>
                          <Label htmlFor="donor-address" className="text-sm">Address</Label>
                          <Input
                            id="donor-address"
                            type="text"
                            placeholder="Street address"
                            value={donorAddress}
                            onChange={(e) => setDonorAddress(e.target.value)}
                            data-testid="input-donor-address"
                            className="mt-1"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="donor-city" className="text-sm">City</Label>
                            <Input
                              id="donor-city"
                              type="text"
                              placeholder="City"
                              value={donorCity}
                              onChange={(e) => setDonorCity(e.target.value)}
                              data-testid="input-donor-city"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="donor-postcode" className="text-sm">Postcode</Label>
                            <Input
                              id="donor-postcode"
                              type="text"
                              placeholder="Postcode"
                              value={donorPostcode}
                              onChange={(e) => setDonorPostcode(e.target.value)}
                              data-testid="input-donor-postcode"
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <Info className="h-3 w-3 inline mr-1" />
                          Your address is required for {taxReliefProgram.name} claims
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button className="w-full" style={{ backgroundColor: primaryColor }} data-testid="button-donate-now">
                  <Heart className="h-4 w-4 mr-2" />
                  Donate Now
                </Button>
              </CardFooter>
            </Card>
          </section>
        )}

        {/* Prayer Times Section */}
        {settings.showPrayerTimes && prayerTimes && prayerTimes.cachedPrayerTimes && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <Clock className="h-8 w-8" style={{ color: primaryColor }} />
              <h2 className="text-3xl font-bold">Prayer Times</h2>
            </div>
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle>Today's Prayer Schedule</CardTitle>
                <CardDescription>
                  {prayerTimes.city}, {prayerTimes.country}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(prayerTimes.cachedPrayerTimes).map(([prayer, time]) => (
                    <div key={prayer} className="text-center p-4 rounded-lg bg-muted">
                      <p className="text-sm font-medium text-muted-foreground capitalize">{prayer}</p>
                      <p className="text-lg font-bold">{time as string}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Sermons & Media Section */}
        {settings.showSermons && sermons && sermons.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <BookOpen className="h-8 w-8" style={{ color: primaryColor }} />
              <h2 className="text-3xl font-bold">Sermons & Media</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sermons.map((sermon: any) => (
                <Card key={sermon.id} className="hover-elevate">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">{sermon.platform || 'Video'}</Badge>
                      {sermon.category && (
                        <Badge variant="outline">{sermon.category}</Badge>
                      )}
                    </div>
                    <CardTitle className="line-clamp-2">{sermon.title}</CardTitle>
                    <CardDescription>
                      {new Date(sermon.publishedAt || sermon.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  {sermon.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {sermon.description}
                      </p>
                    </CardContent>
                  )}
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      <Video className="h-4 w-4 mr-2" />
                      Watch Sermon
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Volunteer Opportunities Section */}
        {settings.showVolunteers && volunteers && volunteers.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <HandHeart className="h-8 w-8" style={{ color: primaryColor }} />
              <h2 className="text-3xl font-bold">Volunteer With Us</h2>
            </div>
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle>Join Our Team of Volunteers</CardTitle>
                <CardDescription>
                  We have {volunteers.length} active volunteers making a difference in our community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Whether you can spare a few hours a week or want to commit to a regular schedule, 
                  we have opportunities that match your skills and availability.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">Community Outreach</Badge>
                  <Badge variant="secondary">Event Support</Badge>
                  <Badge variant="secondary">Administrative Help</Badge>
                  <Badge variant="secondary">Teaching & Mentoring</Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" style={{ backgroundColor: secondaryColor }} data-testid="button-volunteer-signup">
                  <Users className="h-4 w-4 mr-2" />
                  Sign Up to Volunteer
                </Button>
              </CardFooter>
            </Card>
          </section>
        )}

        {/* Activities & Classes Section */}
        {settings.showActivities && activities && activities.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <Calendar className="h-8 w-8" style={{ color: primaryColor }} />
              <h2 className="text-3xl font-bold">Classes & Activities</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activities.map((activity) => (
                <Card key={activity.id} className="hover-elevate">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      {activity.category && (
                        <Badge variant="secondary">{activity.category}</Badge>
                      )}
                      {activity.isPaid && (
                        <Badge variant="outline">
                          {activity.currency} {parseFloat(activity.price).toFixed(2)}
                        </Badge>
                      )}
                    </div>
                    <CardTitle>{activity.title}</CardTitle>
                    <CardDescription className="flex flex-col gap-2">
                      {activity.teacher && (
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {activity.teacher}
                        </span>
                      )}
                      {activity.scheduleType && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {activity.scheduleType.charAt(0).toUpperCase() + activity.scheduleType.slice(1)}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  {activity.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {activity.description}
                      </p>
                    </CardContent>
                  )}
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      View Details & Register
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Prayer Wall Section */}
        {settings.showPrayerWall && slug && organization.id && (
          <PublicPrayerWall orgId={organization.id} orgSlug={slug} />
        )}

        {/* Chatbot Widget */}
        {settings.showChatbot !== false && slug && (
          <div className="fixed bottom-4 right-4 z-50">
            {chatOpen ? (
              <AIAssistantChat 
                onClose={() => setChatOpen(false)} 
                orgSlug={slug}
              />
            ) : (
              <Button
                size="icon"
                className="h-14 w-14 rounded-full shadow-lg"
                style={{ backgroundColor: primaryColor }}
                onClick={() => setChatOpen(true)}
                data-testid="button-open-chat"
              >
                <MessageCircle className="h-6 w-6" />
              </Button>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-8 border-t">
          <p className="text-muted-foreground">
            Powered by Plegit
          </p>
        </footer>
      </div>
    </div>
  );
}
