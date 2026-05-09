import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, CreditCard, ExternalLink, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useEffect } from "react";
import { useLocation } from "wouter";

interface StripeConnection {
  connected: boolean;
  accountId?: string;
  accountStatus?: string;
  scope?: string;
}

interface StripeConnectionSettingsProps {
  orgId: string;
}

export default function StripeConnectionSettings({ orgId }: StripeConnectionSettingsProps) {
  const { toast } = useToast();
  const [location] = useLocation();

  // Check for OAuth callback success/error in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const stripeConnected = searchParams.get('stripe_connected');
    const stripeError = searchParams.get('stripe_error');

    if (stripeConnected === 'true') {
      toast({
        title: "Stripe Connected Successfully",
        description: "Your Stripe account has been connected and is ready to receive payments.",
      });
      // Clear the query params from URL
      window.history.replaceState({}, '', '/dashboard/settings');
      // Invalidate query to refresh connection status
      queryClient.invalidateQueries({ queryKey: ["/api/org", orgId, "stripe"] });
    }

    if (stripeError) {
      toast({
        title: "Stripe Connection Failed",
        description: `Failed to connect Stripe account: ${stripeError}`,
        variant: "destructive",
      });
      // Clear the query params from URL
      window.history.replaceState({}, '', '/dashboard/settings');
    }
  }, [location, orgId, toast]);

  // Fetch Stripe connection status
  const { data: connection, isLoading } = useQuery<StripeConnection>({
    queryKey: ["/api/org", orgId, "stripe"],
    queryFn: async () => {
      const res = await fetch(`/api/org/${orgId}/stripe`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch Stripe connection');
      return res.json();
    },
  });

  // Initiate Stripe Connect
  const connectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/org/${orgId}/stripe/connect`, {});
      const data = await response.json();
      return data as { url: string };
    },
    onSuccess: (data: { url: string }) => {
      // Redirect to Stripe OAuth
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to initiate Stripe connection",
        variant: "destructive",
      });
    },
  });

  // Disconnect Stripe
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/org/${orgId}/stripe/disconnect`, {});
    },
    onSuccess: () => {
      toast({
        title: "Stripe Disconnected",
        description: "Your Stripe account has been disconnected successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/org", orgId, "stripe"] });
    },
    onError: (error: any) => {
      toast({
        title: "Disconnection Failed",
        description: error.message || "Failed to disconnect Stripe account",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
          <CardDescription>Connect your Stripe account to accept donations</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-6 h-6" />
          Payment Settings
        </CardTitle>
        <CardDescription>
          Connect your Stripe account to receive donations directly. Donors can make one-time or recurring donations through your campaigns.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!connection?.connected ? (
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to connect a Stripe account to start receiving donations. Stripe handles all payment processing securely.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="font-semibold">Why Connect Stripe?</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Accept one-time and recurring donations</li>
                <li>Support for multiple currencies (GBP, USD, AED, and more)</li>
                <li>Secure payment processing with PCI compliance</li>
                <li>Automated receipt generation and tax documentation</li>
                <li>Real-time donation tracking and reporting</li>
              </ul>
            </div>

            <Separator />

            <Button
              onClick={() => connectMutation.mutate()}
              disabled={connectMutation.isPending}
              size="lg"
              data-testid="button-connect-stripe"
            >
              {connectMutation.isPending ? "Connecting..." : "Connect Stripe Account"}
            </Button>
          </>
        ) : (
          <>
            <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Your Stripe account is connected and ready to receive donations.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Account ID
                  </label>
                  <p className="font-mono text-sm" data-testid="text-stripe-account-id">
                    {connection.accountId}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <div>
                    <Badge 
                      variant={connection.accountStatus === 'active' ? 'default' : 'secondary'}
                      data-testid="badge-stripe-status"
                    >
                      {connection.accountStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
                  data-testid="button-stripe-dashboard"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Stripe Dashboard
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Are you sure you want to disconnect your Stripe account? You will no longer be able to receive donations until you reconnect.')) {
                      disconnectMutation.mutate();
                    }
                  }}
                  disabled={disconnectMutation.isPending}
                  data-testid="button-disconnect-stripe"
                >
                  {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect Stripe"}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
