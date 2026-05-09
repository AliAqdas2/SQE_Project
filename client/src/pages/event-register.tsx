import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Users, Video, Loader2, CheckCircle, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Event, EventTicketType } from "@shared/schema";
import { getDonationCategories } from "@shared/constants";
import { STRIPE_PUBLISHABLE_KEY } from "@/lib/Constants";

const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

type PublicEvent = Event & {
  registrationCount: number;
  spotsLeft: number;
  organizationReligion?: string | null;
};

const registrationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  cardholderName: z.string().min(1, "Cardholder name is required"),
  ticketTypeId: z.string().optional(),
  ticketCount: z.number().min(1).max(10),
  donationAmount: z.number().min(0).optional(),
  donationCategory: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

function PaymentForm({ 
  clientSecret, 
  cardholderName,
  onSuccess 
}: { 
  clientSecret: string; 
  cardholderName: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/event-registration-success`,
        payment_method_data: {
          billing_details: {
            name: cardholderName,
          },
        },
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
        data-testid="button-complete-payment"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          "Complete Registration"
        )}
      </Button>
    </form>
  );
}

export default function EventRegisterPage() {
  const [, params] = useRoute("/events/:eventId/register");
  const eventId = params?.eventId || "";
  const { toast } = useToast();
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string>("");

  const { data: event, isLoading } = useQuery<PublicEvent>({
    queryKey: [`/api/events/public/${eventId}`],
    enabled: !!eventId,
  });

  // Fetch ticket types for this event
  const { data: ticketTypes = [] } = useQuery<EventTicketType[]>({
    queryKey: [`/api/events/${eventId}/ticket-types`],
    enabled: !!eventId,
  });

  // Get donation categories based on organization religion
  const donationCategories = getDonationCategories(event?.organizationReligion);

  // Filter available ticket types based on:
  // 1. isActive flag
  // 2. Sale dates (if set)
  // 3. Available quantity
  const now = new Date();
  const availableTicketTypes = ticketTypes.filter(ticket => {
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

  // Auto-select ticket type if only one is available
  const defaultTicketTypeId = availableTicketTypes.length === 1 
    ? availableTicketTypes[0].id 
    : undefined;

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      ticketTypeId: defaultTicketTypeId,
      ticketCount: 1,
      donationAmount: 0,
      donationCategory: donationCategories[0]?.value || "general",
    },
  });

  // Update default ticket type when availableTicketTypes changes
  useEffect(() => {
    if (availableTicketTypes.length === 1 && !form.getValues("ticketTypeId")) {
      form.setValue("ticketTypeId", availableTicketTypes[0].id);
    }
  }, [availableTicketTypes.length, availableTicketTypes, form]);

  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationFormData) => {
      // Ensure ticketTypeId is included if ticket types exist
      const payload: any = {
        ...data,
        ticketTypeId: availableTicketTypes.length > 0 
          ? (data.ticketTypeId || availableTicketTypes[0]?.id)
          : undefined,
      };
      const response = await apiRequest("POST", `/api/events/${eventId}/register`, payload);
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.requiresPayment) {
        setClientSecret(data.clientSecret);
        setQrCode(data.qrCode);
      } else {
        setRegistrationSuccess(true);
        setQrCode(data.registration.qrCode);
        toast({
          title: "Registration Successful!",
          description: "You're all set for the event.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Event not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="pt-6 text-center space-y-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h2 className="text-2xl font-bold mb-2">Registration Confirmed!</h2>
              <p className="text-muted-foreground">
                You're all set for {event.title}
              </p>
            </div>
            <div className="bg-muted p-6 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Your QR Code</p>
              <p className="text-2xl font-mono font-bold" data-testid="text-qr-code">{qrCode}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Show this at check-in
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              A confirmation email has been sent to {form.getValues("email")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedTicketTypeId = form.watch("ticketTypeId");
  const selectedTicketType = availableTicketTypes.find(t => t.id === selectedTicketTypeId);
  
  // Use selected ticket type price, or fall back to event base price if no ticket types exist
  const ticketPrice = selectedTicketType 
    ? parseFloat(selectedTicketType.price) 
    : availableTicketTypes.length === 0 
      ? parseFloat(event.price) 
      : 0;
  
  const ticketCount = form.watch("ticketCount");
  const donationAmount = form.watch("donationAmount") || 0;
  const ticketTotal = ticketPrice * ticketCount;
  const totalAmount = ticketTotal + donationAmount;
  const isFree = ticketPrice === 0;
  const spotsLeft = event.spotsLeft || 0;
  const isSoldOut = spotsLeft <= 0;

  // Get min/max ticket count from selected ticket type
  const minTicketCount = selectedTicketType?.minPerOrder || 1;
  const maxTicketCount = selectedTicketType 
    ? Math.min(selectedTicketType.maxPerOrder, selectedTicketType.quantity - selectedTicketType.sold, spotsLeft)
    : Math.min(10, spotsLeft);

  const currencySymbol = {
    USD: "$",
    GBP: "£",
    EUR: "€",
    AED: "AED ",
  }[event.currency || "USD"] || "$";

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Event Details */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-3xl" data-testid="text-event-title">{event.title}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={event.eventType === "virtual" ? "secondary" : "default"}>
                    {event.eventType}
                  </Badge>
                  {isFree ? (
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-950">Free Event</Badge>
                  ) : (
                    <Badge variant="outline">{currencySymbol}{ticketPrice.toLocaleString()}</Badge>
                  )}
                  {isSoldOut && <Badge variant="destructive">Sold Out</Badge>}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {new Date(event.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">{event.time}</p>
                </div>
              </div>

              {(event.eventType === "in-person" || event.eventType === "hybrid") && event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{event.location}</p>
                </div>
              )}

              {(event.eventType === "virtual" || event.eventType === "hybrid") && event.livestreamUrl && (
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">Virtual attendance available</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">
                  {spotsLeft} {spotsLeft === 1 ? "spot" : "spots"} remaining
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form */}
        {!isSoldOut && !clientSecret && (
          <Card>
            <CardHeader>
              <CardTitle>Register for Event</CardTitle>
              <CardDescription>Fill in your details to secure your spot</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-firstname" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-lastname" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cardholderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cardholder Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Name on card" data-testid="input-cardholder-name" />
                        </FormControl>
                        <FormDescription>
                          The name as it appears on your payment card
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Ticket Type Selection - only show if multiple ticket types exist */}
                  {availableTicketTypes.length > 1 && (
                    <FormField
                      control={form.control}
                      name="ticketTypeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ticket Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-ticket-type">
                                <SelectValue placeholder="Select a ticket type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableTicketTypes.map((ticket) => (
                                <SelectItem key={ticket.id} value={ticket.id}>
                                  <div className="flex items-center justify-between w-full">
                                    <span>{ticket.name}</span>
                                    <span className="ml-4 text-muted-foreground">
                                      {currencySymbol}{parseFloat(ticket.price).toLocaleString()}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedTicketType?.description && (
                            <FormDescription>{selectedTicketType.description}</FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Show selected ticket type info if only one or if one is selected */}
                  {(availableTicketTypes.length === 1 || selectedTicketType) && (
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {selectedTicketType?.name || availableTicketTypes[0]?.name}
                        </span>
                        <span className="text-sm font-bold">
                          {currencySymbol}{ticketPrice.toLocaleString()} per ticket
                        </span>
                      </div>
                      {selectedTicketType?.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedTicketType.description}
                        </p>
                      )}
                      {selectedTicketType && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedTicketType.quantity - selectedTicketType.sold} tickets remaining
                        </p>
                      )}
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="ticketCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Tickets</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={minTicketCount}
                            max={maxTicketCount}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || minTicketCount)}
                            data-testid="input-ticket-count"
                          />
                        </FormControl>
                        <FormDescription>
                          {minTicketCount === maxTicketCount 
                            ? `Only ${maxTicketCount} ticket${maxTicketCount === 1 ? '' : 's'} available`
                            : `Select between ${minTicketCount} and ${maxTicketCount} tickets`
                          }
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {event.allowDonations && (
                    <>
                      <FormField
                        control={form.control}
                        name="donationAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              <Coins className="h-4 w-4 inline mr-1" />
                              Optional Donation
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min={0}
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                data-testid="input-donation"
                              />
                            </FormControl>
                            <FormDescription>
                              Support our cause with an optional donation
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {donationCategories.length > 1 && donationAmount > 0 && (
                        <FormField
                          control={form.control}
                          name="donationCategory"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Donation Category</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-donation-category">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {donationCategories.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                      {cat.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </>
                  )}

                  <Separator />

                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Tickets ({ticketCount})</span>
                      <span data-testid="text-ticket-total">
                        {currencySymbol}{ticketTotal.toLocaleString()}
                      </span>
                    </div>
                    {donationAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Donation</span>
                        <span data-testid="text-donation-total">
                          {currencySymbol}{donationAmount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span data-testid="text-total-amount">
                        {currencySymbol}{totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="w-full"
                    data-testid="button-register"
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isFree ? (
                      "Complete Registration"
                    ) : (
                      `Continue to Payment (${currencySymbol}${totalAmount.toLocaleString()})`
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Payment Form */}
        {clientSecret && (
          <Card>
            <CardHeader>
              <CardTitle>Complete Payment</CardTitle>
              <CardDescription>
                Total: {currencySymbol}{totalAmount.toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm
                  clientSecret={clientSecret}
                  cardholderName={form.getValues("cardholderName") || `${form.getValues("firstName")} ${form.getValues("lastName")}`}
                  onSuccess={() => setRegistrationSuccess(true)}
                />
              </Elements>
            </CardContent>
          </Card>
        )}

        {isSoldOut && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                This event is sold out. Please check back later for future events.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
