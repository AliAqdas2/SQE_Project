import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { DonationForm } from "@/components/donation-form";
import { StripePaymentForm } from "@/components/stripe-payment-form";
import { CampaignProgress } from "@/components/campaign-progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Share2, Calendar, MapPin, ChevronRight, CheckCircle2, Users } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Campaign, Organization } from "@shared/schema";

type CampaignUpdate = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
};

interface CampaignWithOrg extends Campaign {
  organization?: Organization & {
    settings?: { giftAidPercentage?: number } | null;
  };
  donorCount?: number;
  daysLeft?: number;
  publicUpdates?: CampaignUpdate[];
  p2pEnabled?: boolean;
  allowSelfSignup?: boolean;
}

export default function CampaignPublicPage() {
  const [, params] = useRoute("/c/:slug/:campaignId");
  const { toast } = useToast();
  const [paymentStep, setPaymentStep] = useState<"form" | "payment" | "success">("form");
  const [clientSecret, setClientSecret] = useState<string>("");
  const [donationAmount, setDonationAmount] = useState<number>(0);

  const { data: campaign, isLoading } = useQuery<CampaignWithOrg>({
    queryKey: ["/api/campaigns/public", params?.campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/public/${params?.campaignId}`);
      if (!res.ok) throw new Error("Failed to fetch campaign");
      return res.json();
    },
    enabled: !!params?.campaignId,
  });

  const donateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/campaigns/${params?.campaignId}/donate`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      // Store client secret and amount for payment form
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Campaign not found</h1>
          <p className="text-muted-foreground">This campaign may have been removed or is no longer active.</p>
        </div>
      </div>
    );
  }

  const handleDonation = (donationData: any) => {
    setDonationAmount(donationData.totalAmount);
    donateMutation.mutate(donationData);
  };

  const handlePaymentSuccess = () => {
    setPaymentStep("success");
    toast({
      title: "Thank you for your donation!",
      description: "Your support makes a real difference.",
    });
    queryClient.invalidateQueries({ queryKey: ["/api/campaigns/public", params?.campaignId] });
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment failed",
      description: error,
      variant: "destructive",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: campaign.title,
        text: campaign.description || "",
        url: window.location.href,
      }).catch(() => {
        // User cancelled share
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Campaign link copied to clipboard",
      });
    }
  };

  // Parse quick donation buttons - handle both array and JSON string
  const parseQuickDonationButtons = () => {
    if (!campaign.quickDonationButtons) {
      return [
        { amount: 25, description: "Small contribution" },
        { amount: 50, description: "Standard donation" },
        { amount: 100, description: "Major supporter" },
      ];
    }

    let buttons = campaign.quickDonationButtons;
    
    // If it's a string, try to parse it as JSON
    if (typeof buttons === 'string') {
      try {
        buttons = JSON.parse(buttons);
      } catch (e) {
        console.error('Failed to parse quickDonationButtons:', e);
        return [
          { amount: 25, description: "Small contribution" },
          { amount: 50, description: "Standard donation" },
          { amount: 100, description: "Major supporter" },
        ];
      }
    }

    // If it's an array, map it
    if (Array.isArray(buttons) && buttons.length > 0) {
      return buttons.map((btn: any) => ({
        amount: typeof btn.amount === 'string' ? parseFloat(btn.amount) : btn.amount,
        description: btn.description || "",
      }));
    }

    // Fallback to default
    return [
      { amount: 25, description: "Small contribution" },
      { amount: 50, description: "Standard donation" },
      { amount: 100, description: "Major supporter" },
    ];
  };

  const suggestedAmounts = parseQuickDonationButtons();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative w-full h-[400px] bg-gradient-to-br from-primary/20 to-accent/20">
        {campaign.imageUrl && (
          <>
            <img
              src={campaign.imageUrl}
              alt={campaign.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
          </>
        )}
        
        {/* Organization badge */}
        {campaign.organization && (
          <div className="absolute top-6 left-6">
            <Badge variant="secondary" className="text-sm backdrop-blur-sm bg-background/80">
              {campaign.organization.name}
            </Badge>
          </div>
        )}

        {/* Share button */}
        <div className="absolute top-6 right-6">
          <Button
            variant="outline"
            size="icon"
            onClick={handleShare}
            className="backdrop-blur-sm bg-background/80"
            data-testid="button-share"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Title and status */}
        <div className="absolute bottom-6 left-6 right-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            {campaign.status === "active" && (
              <Badge className="bg-green-500 text-white border-0">
                Active
              </Badge>
            )}
            {campaign.category && (
              <Badge variant="secondary" className="backdrop-blur-sm bg-background/80 text-foreground">
                {campaign.category}
              </Badge>
            )}
          </div>
          <h1 className="text-4xl font-bold mb-2 drop-shadow-lg" data-testid="text-campaign-title">
            {campaign.title}
          </h1>
          <div className="flex items-center gap-4 text-sm">
            {campaign.country && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {campaign.country}
              </div>
            )}
            {campaign.endDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Ends {new Date(campaign.endDate).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content - 2/3 */}
          <div className="lg:col-span-2 space-y-8">
            {/* Campaign Progress */}
            <CampaignProgress
              raised={parseFloat(campaign.currentAmount || "0")}
              goal={parseFloat(campaign.goalAmount)}
              currency={campaign.currency || "USD"}
              donorCount={campaign.donorCount}
              daysLeft={campaign.daysLeft}
              variant="thermometer"
            />

            {/* P2P Fundraising CTA */}
            {campaign.p2pEnabled && campaign.allowSelfSignup && (
              <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-bold">Start Your Own Fundraiser</h3>
                      </div>
                      <p className="text-muted-foreground">
                        Create your personal fundraising page and help us reach our goal. Share with your network and make an even bigger impact!
                      </p>
                    </div>
                    <Link href={`/p2p/signup/${campaign.id}`}>
                      <Button size="lg" className="w-full sm:w-auto">
                        Start Fundraising
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {campaign.description && (
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-bold mb-4">About this campaign</h2>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                      {campaign.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Page Components */}
            {Array.isArray(campaign.pageComponents) && campaign.pageComponents.length > 0 && (
              <div className="space-y-6">
                {campaign.pageComponents.map((component: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      {component.type === "header" && (
                        <h2 className="text-3xl font-bold mb-2">{component.content}</h2>
                      )}
                      {component.type === "text" && (
                        <div className="prose prose-sm max-w-none">
                          <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                            {component.content}
                          </p>
                        </div>
                      )}
                      {component.type === "image" && (
                        <img
                          src={component.content}
                          alt={component.alt || "Campaign image"}
                          className="w-full rounded-md"
                        />
                      )}
                      {component.type === "video" && (
                        <div className="relative pt-[56.25%]">
                          <iframe
                            src={component.content}
                            className="absolute inset-0 w-full h-full rounded-md"
                            allowFullScreen
                          />
                        </div>
                      )}
                      {component.type === "button" && (
                        <Button asChild className="w-full sm:w-auto">
                          <a href={component.url} target="_blank" rel="noopener noreferrer">
                            {component.text}
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Campaign Updates */}
            {campaign.publicUpdates && campaign.publicUpdates.length > 0 && (
              <Card data-testid="card-public-updates">
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-bold mb-6">Campaign Updates</h2>
                  <div className="space-y-6">
                    {campaign.publicUpdates.map((update) => (
                      <div key={update.id} className="border-l-2 border-primary pl-4" data-testid={`public-update-${update.id}`}>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(update.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                          <h3 className="text-lg font-semibold" data-testid={`update-title-${update.id}`}>
                            {update.title}
                          </h3>
                          {update.imageUrl && (
                            <div className="w-full overflow-hidden rounded-md border border-border bg-muted/30">
                            <img
                              src={update.imageUrl}
                              alt={update.title}
                                className="w-full h-auto max-h-96 object-contain mx-auto block"
                                style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                              data-testid={`update-image-${update.id}`}
                            />
                            </div>
                          )}
                          <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed" data-testid={`update-content-${update.id}`}>
                            {update.content}
                          </p>
                        </div>
                        {campaign.publicUpdates && update.id !== campaign.publicUpdates[campaign.publicUpdates.length - 1].id && (
                          <Separator className="mt-6" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - 1/3 */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              {paymentStep === "form" && (
                <DonationForm
                  campaignId={campaign.id}
                  campaignTitle={campaign.title}
                  suggestedAmounts={suggestedAmounts}
                  currency={campaign.currency || "USD"}
                  organizationReligion={campaign.organization?.religion || undefined}
                    organizationCountry={campaign.organization?.country || undefined}
                    organizationSettings={campaign.organization?.settings || undefined}
                  onSubmit={handleDonation}
                  isLoading={donateMutation.isPending}
                />
              )}
              
              {paymentStep === "payment" && clientSecret && (
                <StripePaymentForm
                  clientSecret={clientSecret}
                  amount={donationAmount}
                  currency={campaign.currency || "USD"}
                  campaignId={campaign.id}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              )}

              {paymentStep === "success" && (
                <Card>
                  <CardContent className="pt-6 text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Thank You!</h3>
                      <p className="text-muted-foreground">
                        Your donation has been successfully processed. You should receive a confirmation email shortly.
                      </p>
                    </div>
                    <Button onClick={() => setPaymentStep("form")} variant="outline" className="w-full">
                      Make Another Donation
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
