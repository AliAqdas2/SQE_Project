import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { DonationForm } from "@/components/donation-form";
import { StripePaymentForm } from "@/components/stripe-payment-form";
import { CampaignProgress } from "@/components/campaign-progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Share2, Heart, Users, Trophy, Target, ArrowLeft, CheckCircle2, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";
import type { P2PParticipant, Campaign } from "@shared/schema";
import { Link } from "wouter";

interface P2PParticipantPublicData {
  participant: P2PParticipant;
  campaign: Campaign & {
    organization?: {
      id: string;
      name: string;
      logo?: string | null;
      slug?: string | null;
      religion?: string | null;
      country?: string | null;
    };
  };
  badges: Array<{ id: string; badgeId: string; unlockedAt: string }>;
}

export default function P2PParticipantPublicPage() {
  const [, params] = useRoute("/p2p/:slug");
  const slug = params?.slug;
  const { toast } = useToast();
  const { formatCurrency } = useOrganizationLocale();
  const [paymentStep, setPaymentStep] = useState<"form" | "payment" | "success">("form");
  const [clientSecret, setClientSecret] = useState<string>("");
  const [donationAmount, setDonationAmount] = useState<number>(0);

  const { data, isLoading, error } = useQuery<P2PParticipantPublicData>({
    queryKey: [`/api/public/p2p/participants/${slug}`],
    queryFn: async () => {
      const res = await fetch(`/api/public/p2p/participants/${slug}`);
      if (!res.ok) throw new Error("Failed to fetch participant");
      return res.json();
    },
    enabled: !!slug,
  });

  const donateMutation = useMutation({
    mutationFn: async (donationData: any) => {
      const res = await apiRequest("POST", `/api/p2p/participants/${data?.participant.id}/donate`, {
        ...donationData,
        campaignId: data?.campaign.id,
      });
      return await res.json();
    },
    onSuccess: (response) => {
      if (response.clientSecret) {
        setClientSecret(response.clientSecret);
        setPaymentStep("payment");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Donation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDonation = (donationData: any) => {
    setDonationAmount(donationData.totalAmount);
    donateMutation.mutate(donationData);
  };

  const handlePaymentSuccess = () => {
    setPaymentStep("success");
    queryClient.invalidateQueries({ queryKey: [`/api/public/p2p/participants/${slug}`] });
    toast({
      title: "Thank you for your donation!",
      description: "Your support makes a real difference.",
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Support ${data?.participant.firstName}'s fundraiser`,
          text: data?.participant.bio || `Help ${data?.participant.firstName} reach their fundraising goal!`,
          url,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied",
        description: "Fundraiser link copied to clipboard!",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading fundraiser page...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Fundraiser Not Found</h1>
          <p className="text-muted-foreground">
            This fundraiser page may have been removed or is no longer active.
          </p>
          <Link href="/">
            <Button variant="outline">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { participant, campaign } = data;
  const raised = parseFloat(participant.raisedAmount || "0");
  const goal = parseFloat(participant.goalAmount);
  const progress = Math.min((raised / goal) * 100, 100);
  const percentOfGoal = (raised / goal) * 100;

  // Extract first paragraph for description
  const getFirstParagraph = (text: string | null | undefined): string => {
    if (!text) return "";
    // Split by newlines or periods, take first meaningful paragraph
    const paragraphs = text.split(/\n\n|\.\s+/).filter(p => p.trim().length > 0);
    const firstPara = paragraphs[0] || text;
    // Limit to 200 characters for social sharing
    return firstPara.length > 200 ? firstPara.substring(0, 197) + "..." : firstPara;
  };

  const fundraiserTitle = `${participant.firstName} ${participant.lastName}'s Fundraiser`;
  const fundraiserDescription = getFirstParagraph(participant.bio || campaign.description);
  const shareUrl = window.location.href;
  
  // Get campaign banner image - ensure it's an absolute URL
  const getAbsoluteImageUrl = (imageUrl: string | null | undefined): string => {
    if (!imageUrl) return "";
    // If already absolute URL, return as is
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }
    // If relative URL, make it absolute
    if (imageUrl.startsWith("/")) {
      return `${window.location.origin}${imageUrl}`;
    }
    // If it's an object path, convert to API URL
    if (imageUrl.startsWith("/objects/")) {
      return `${window.location.origin}/api/files${imageUrl}`;
    }
    // Default: assume it needs the origin prefix
    return `${window.location.origin}/${imageUrl}`;
  };
  
  const ogImage = getAbsoluteImageUrl(campaign.imageUrl || campaign.bannerImageUrl);
  const keywords = [
    "fundraiser",
    "donation",
    campaign.title,
    participant.firstName,
    participant.lastName,
    campaign.organization?.name,
  ].filter(Boolean).join(", ");

  // Set up Open Graph meta tags
  useEffect(() => {
    if (!data) return;

    // Update or create meta tags
    const setMetaTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("property", property);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    // Set Open Graph tags
    setMetaTag("og:title", fundraiserTitle);
    setMetaTag("og:description", fundraiserDescription);
    setMetaTag("og:url", shareUrl);
    if (ogImage) {
      setMetaTag("og:image", ogImage);
      setMetaTag("og:image:width", "1200");
      setMetaTag("og:image:height", "630");
      setMetaTag("og:image:type", "image/jpeg");
    }
    setMetaTag("og:keywords", keywords);
    setMetaTag("og:type", "website");
    setMetaTag("og:site_name", campaign.organization?.name || "Plegit");

    // Twitter Card tags
    const setTwitterMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", name);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    setTwitterMeta("twitter:card", "summary_large_image");
    setTwitterMeta("twitter:title", fundraiserTitle);
    setTwitterMeta("twitter:description", fundraiserDescription);
    if (ogImage) {
      setTwitterMeta("twitter:image", ogImage);
    }

    // Also set standard meta tags for better compatibility
    const setStandardMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", name);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    setStandardMeta("description", fundraiserDescription);
    setStandardMeta("keywords", keywords);

    // Update page title
    document.title = fundraiserTitle;

    // Cleanup function
    return () => {
      // Optionally remove meta tags on unmount, but usually we want to keep them
      // until the next page loads, so we'll leave them
    };
  }, [data, fundraiserTitle, fundraiserDescription, shareUrl, ogImage, keywords]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/c/${campaign.slug || 'campaign'}/${campaign.id}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaign
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {paymentStep === "success" ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold">Thank You!</h2>
              <p className="text-muted-foreground">
                Your donation of {formatCurrency(donationAmount)} has been received.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setPaymentStep("form")} variant="outline">
                  Make Another Donation
                </Button>
                <Link href={`/c/${campaign.slug || 'campaign'}/${campaign.id}`}>
                  <Button>View Campaign</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Participant Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    {participant.avatarUrl ? (
                      <img
                        src={participant.avatarUrl}
                        alt={`${participant.firstName} ${participant.lastName}`}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold">
                        {participant.firstName[0]}{participant.lastName[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h1 className="text-3xl font-bold">
                          {participant.firstName} {participant.lastName}'s Fundraiser
                        </h1>
                        <p className="text-muted-foreground mt-1">
                          Supporting <Link href={`/c/${campaign.slug || 'campaign'}/${campaign.id}`} className="text-primary hover:underline">{campaign.title}</Link>
                        </p>
                      </div>
                      <Badge variant={participant.status === 'active' ? 'default' : 'secondary'}>
                        {participant.status}
                      </Badge>
                    </div>
                    {participant.bio && (
                      <p className="text-muted-foreground mt-4">{participant.bio}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Fundraising Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Raised</span>
                    <span className="font-semibold">{formatCurrency(raised)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Goal</span>
                    <span className="font-semibold">{formatCurrency(goal)}</span>
                  </div>
                  <CampaignProgress raised={raised} goal={goal} />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {percentOfGoal.toFixed(0)}% of goal reached
                    </span>
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {participant.donationCount} donations
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Donation Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Support This Fundraiser
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentStep === "form" ? (
                  <DonationForm
                    campaignId={campaign.id}
                    campaignTitle={`${participant.firstName}'s Fundraiser for ${campaign.title}`}
                    currency={campaign.currency || "GBP"}
                    organizationReligion={campaign.organization?.religion}
                    organizationCountry={campaign.organization?.country || undefined}
                    organizationSettings={campaign.organization?.settings || undefined}
                    onSubmit={handleDonation}
                    isLoading={donateMutation.isPending}
                  />
                ) : (
                  <StripePaymentForm
                    clientSecret={clientSecret}
                    amount={donationAmount}
                    currency={campaign.currency || "GBP"}
                    campaignId={campaign.id}
                    onSuccess={handlePaymentSuccess}
                    onError={(error) => {
                      toast({
                        title: "Payment failed",
                        description: error,
                        variant: "destructive",
                      });
                      setPaymentStep("form");
                    }}
                  />
                )}
              </CardContent>
            </Card>

            {/* Campaign Info */}
            <Card>
              <CardHeader>
                <CardTitle>About the Campaign</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{campaign.description}</p>
                <div className="mt-4">
                  <Link href={`/c/${campaign.slug || 'campaign'}/${campaign.id}`}>
                    <Button variant="outline" className="w-full">
                      View Full Campaign
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
