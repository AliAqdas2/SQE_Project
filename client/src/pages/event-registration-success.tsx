import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";

export default function EventRegistrationSuccessPage() {
  const [, setLocation] = useLocation();
  const [orgSlug, setOrgSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get payment intent from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntentId = urlParams.get('payment_intent');

    if (!paymentIntentId) {
      setIsLoading(false);
      return;
    }

    // Fetch event details from payment intent metadata via backend
    const fetchOrgSlug = async () => {
      try {
        // Get payment intent details from backend (which has access to Stripe)
        const response = await fetch(`/api/events/get-org-slug?paymentIntentId=${paymentIntentId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.orgSlug) {
            setOrgSlug(data.orgSlug);
          }
        }
      } catch (error) {
        console.error('Failed to fetch organization slug:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrgSlug();
  }, []);

  const handleReturn = () => {
    if (orgSlug) {
      setLocation(`/p/${orgSlug}`);
    } else {
      setLocation('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" data-testid="icon-success" />
          <div>
            <h2 className="text-2xl font-bold mb-2">Registration Complete!</h2>
            <p className="text-muted-foreground">
              Your payment has been processed and your registration is confirmed.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            A confirmation email with your QR code has been sent to your email address.
          </p>
          {isLoading ? (
            <Button className="w-full" disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </Button>
          ) : (
            <Button className="w-full" onClick={handleReturn} data-testid="button-home">
              Return to {orgSlug ? 'Organization' : 'Home'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
