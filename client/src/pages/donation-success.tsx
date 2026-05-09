import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DonationSuccessPage() {
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const confirmDonation = async () => {
      try {
        // Get payment_intent from URL query params (added by Stripe after redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const paymentIntentId = urlParams.get('payment_intent');
        const clientSecret = urlParams.get('payment_intent_client_secret');

        if (!paymentIntentId || !clientSecret) {
          console.error('Missing payment_intent or client_secret in URL');
          setStatus('success'); // Show success anyway for backwards compatibility
          return;
        }

        console.log('Confirming donation with payment_intent:', paymentIntentId);

        // The confirm-donation endpoint will retrieve the payment intent from Stripe
        // and extract the campaignId from metadata. We use a placeholder in the URL.
        // The endpoint will prioritize metadata over URL param.
        const confirmResponse = await fetch(`/api/campaigns/placeholder/confirm-donation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            paymentIntentId,
            clientSecret // Include client secret for validation
          }),
        });

        if (!confirmResponse.ok) {
          const errorData = await confirmResponse.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to confirm donation');
        }

        const result = await confirmResponse.json();
        console.log('Donation confirmed successfully', result.duplicate ? '(duplicate request)' : '');
        
        setStatus('success');
        toast({
          title: 'Thank you!',
          description: result.duplicate 
            ? 'Your donation was already recorded.' 
            : 'Your donation has been recorded and a receipt has been sent.',
        });
      } catch (error: any) {
        console.error('Donation confirmation error:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Failed to confirm donation');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Payment succeeded but failed to record donation. Please contact support.',
        });
      }
    };

    confirmDonation();
  }, [toast]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
            <CardTitle className="text-2xl">Confirming Your Donation...</CardTitle>
            <CardDescription>
              Please wait while we process your generous contribution.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Confirmation Error</CardTitle>
            <CardDescription>
              {errorMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Your payment was processed, but we encountered an issue recording your donation. 
              Please contact support with your payment confirmation.
            </p>
            <Button asChild className="w-full" data-testid="button-back-home">
              <Link href="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Thank You for Your Donation!</CardTitle>
          <CardDescription>
            Your generosity makes a real difference. You'll receive a confirmation email shortly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
            <p className="text-muted-foreground">
              Your donation has been processed successfully. A receipt has been sent to your email address.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button asChild data-testid="button-back-home">
              <Link href="/">Back to Home</Link>
            </Button>
            <Button variant="outline" asChild data-testid="button-view-campaigns">
              <Link href="/dashboard/campaigns">View More Campaigns</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
