import { useState, useEffect } from "react";
import { useStripe, useElements, PaymentElement, Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Loader2 } from "lucide-react";
import { STRIPE_PUBLISHABLE_KEY } from "@/lib/Constants";

const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  currency: string;
  campaignId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function PaymentForm({ clientSecret, amount, currency, campaignId, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/donation/success`,
          payment_method_data: {
            billing_details: {
              address: {
                postal_code: '00000',
              },
            },
          },
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "Payment failed");
        onError(error.message || "Payment failed");
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded - now confirm donation on backend
        try {
          const response = await fetch(`/api/campaigns/${campaignId}/confirm-donation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to confirm donation');
          }

          onSuccess();
        } catch (confirmError: any) {
          console.error('Donation confirmation error:', confirmError);
          setErrorMessage('Payment succeeded but failed to record donation. Please contact support.');
          onError('Payment succeeded but failed to record donation');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
      onError(err.message || "An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-lg">
        <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
        <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
      </div>

      <PaymentElement 
        options={{
          layout: "tabs",
          fields: {
            billingDetails: {
              address: {
                postalCode: 'never',
              },
            },
          },
        }}
      />

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={!stripe || isProcessing}
        data-testid="button-complete-payment"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay ${formatCurrency(amount)}`
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Your payment is secured by Stripe
      </p>
    </form>
  );
}

interface StripePaymentFormProps {
  clientSecret: string;
  amount: number;
  currency: string;
  campaignId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function StripePaymentForm({ clientSecret, amount, currency, campaignId, onSuccess, onError }: StripePaymentFormProps) {
  const [paymentSuccessful, setPaymentSuccessful] = useState(false);

  const handleSuccess = () => {
    setPaymentSuccessful(true);
    onSuccess();
  };

  if (paymentSuccessful) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-center">Thank You!</CardTitle>
          <CardDescription className="text-center">
            Your donation has been successfully processed
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            You should receive a confirmation email shortly.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
        <CardDescription>
          Enter your card information to complete your donation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
            },
            loader: 'auto',
          }}
        >
          <PaymentForm
            clientSecret={clientSecret}
            amount={amount}
            currency={currency}
            campaignId={campaignId}
            onSuccess={handleSuccess}
            onError={onError}
          />
        </Elements>
      </CardContent>
    </Card>
  );
}
