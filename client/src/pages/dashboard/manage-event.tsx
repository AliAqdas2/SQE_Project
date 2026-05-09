import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin, Users, Loader2, CheckCircle, XCircle, Mail, Phone, Download, Edit, Ticket, Tag, BarChart, QrCode as QrCodeIcon, ScanLine, Search } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Event, EventRegistration } from "@shared/schema";
import { TicketTypesManager } from "@/components/ticket-types-manager";
import { PromoCodesManager } from "@/components/promo-codes-manager";
import { QRCodeDisplay } from "@/components/qr-code-display";
import { QRScanner } from "@/components/qr-scanner";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";

const DEMO_ORG_SLUG = "hope-community";

export default function ManageEventPage() {
  const [, params] = useRoute("/dashboard/events/:eventId/manage");
  const eventId = params?.eventId || "";
  const { toast } = useToast();
  const { formatCurrency } = useOrganizationLocale();
  
  // QR Scanner state
  const [qrCodeInput, setQrCodeInput] = useState("");
  const [lastCheckedIn, setLastCheckedIn] = useState<{ name: string; time: Date } | null>(null);

  const { data: event, isLoading: eventLoading } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId,
  });

  const { data: registrations = [], isLoading: registrationsLoading } = useQuery<EventRegistration[]>({
    queryKey: [`/api/event-registrations`, eventId],
    queryFn: async () => {
      const res = await fetch(`/api/event-registrations?eventId=${eventId}`);
      if (!res.ok) throw new Error("Failed to fetch registrations");
      return res.json();
    },
    enabled: !!eventId,
    refetchInterval: 5000, // Refetch every 5 seconds to catch new registrations
    refetchOnWindowFocus: true, // Refetch when user returns to the tab
  });

  const checkInMutation = useMutation({
    mutationFn: async (registrationId: string) => {
      return await apiRequest("PATCH", `/api/event-registrations/${registrationId}`, {
        checkedIn: true,
        checkedInAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Check-in Successful",
        description: "Attendee has been checked in.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/event-registrations`, eventId] });
    },
    onError: () => {
      toast({
        title: "Check-in Failed",
        description: "Failed to check in attendee. Please try again.",
        variant: "destructive",
      });
    },
  });

  // QR Code check-in mutation
  const qrCheckInMutation = useMutation({
    mutationFn: async (qrCode: string) => {
      const response = await apiRequest("POST", `/api/events/${eventId}/checkin`, { qrCode });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "✓ Check-in Successful!",
        description: data.message,
      });
      setLastCheckedIn({
        name: `${data.registration.firstName} ${data.registration.lastName}`,
        time: new Date(),
      });
      setQrCodeInput("");
      queryClient.invalidateQueries({ queryKey: [`/api/event-registrations`, eventId] });
    },
    onError: async (error: any) => {
      // Try to parse error response
      let errorMessage = "Failed to check in. Please try again.";
      try {
        const errorData = await error.json?.();
        if (errorData?.error === "Already checked in") {
          errorMessage = "This attendee has already been checked in.";
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // Use default message
      }
      toast({
        title: "Check-in Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleQrCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    const code = qrCodeInput.trim();
    if (!code) {
      toast({
        title: "Enter QR Code",
        description: "Please enter or scan a QR code.",
        variant: "destructive",
      });
      return;
    }
    qrCheckInMutation.mutate(code);
  };

  // Camera scanner check-in handler
  const handleCameraScan = async (code: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`/api/events/${eventId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ qrCode: code }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Update the list
        queryClient.invalidateQueries({ queryKey: [`/api/event-registrations`, eventId] });
        setLastCheckedIn({
          name: `${data.registration.firstName} ${data.registration.lastName}`,
          time: new Date(),
        });
        return { 
          success: true, 
          message: `✓ ${data.registration.firstName} ${data.registration.lastName}` 
        };
      } else {
        return { 
          success: false, 
          message: data.error || "Check-in failed" 
        };
      }
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message || "Network error" 
      };
    }
  };

  const exportCSV = () => {
    if (!registrations.length) return;

    const headers = ["First Name", "Last Name", "Email", "Phone", "Tickets", "Total Paid", "Donation", "Status", "QR Code", "Checked In"];
    const rows = registrations.map(r => [
      r.firstName,
      r.lastName,
      r.email,
      r.phone || "",
      r.ticketCount,
      r.totalPaid,
      r.donationAmount || "0",
      r.status,
      r.qrCode,
      r.checkedIn ? "Yes" : "No",
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `event-${eventId}-registrations.csv`;
    a.click();

    toast({
      title: "Export Successful",
      description: "Registrations exported to CSV.",
    });
  };

  if (eventLoading || registrationsLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Event not found</p>
      </div>
    );
  }

  const totalRevenue = registrations.reduce((sum, r) => sum + parseFloat(r.totalPaid), 0);
  const totalDonations = registrations.reduce((sum, r) => sum + parseFloat(r.donationAmount || "0"), 0);
  const checkedInCount = registrations.filter(r => r.checkedIn).length;

  return (
    <div className="p-8 space-y-6">
      {/* Event Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-event-title">{event.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(event.date).toLocaleDateString()} at {event.time}
            </div>
            {event.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {event.location}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/events/${eventId}/edit`}>
            <Button variant="outline" data-testid="button-edit">
              <Edit className="h-4 w-4 mr-2" />
              Edit Event
            </Button>
          </Link>
          <Button variant="outline" onClick={exportCSV} data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BarChart className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tickets" data-testid="tab-tickets">
            <Ticket className="h-4 w-4 mr-2" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="attendees" data-testid="tab-attendees">
            <Users className="h-4 w-4 mr-2" />
            Attendees
          </TabsTrigger>
          <TabsTrigger value="promo-codes" data-testid="tab-promo-codes">
            <Tag className="h-4 w-4 mr-2" />
            Promo Codes
          </TabsTrigger>
          <TabsTrigger value="check-in" data-testid="tab-check-in">
            <CheckCircle className="h-4 w-4 mr-2" />
            Check-in
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-registrations">
                  {registrations.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {event.attendeeCount} / {event.capacity} capacity
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Checked In</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-checked-in">
                  {checkedInCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  {registrations.length > 0 ? Math.round((checkedInCount / registrations.length) * 100) : 0}% attendance
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-revenue">
                  {formatCurrency(totalRevenue, event.currency)}
                </div>
                <p className="text-xs text-muted-foreground">From ticket sales</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Donations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-donations">
                  {formatCurrency(totalDonations, event.currency)}
                </div>
                <p className="text-xs text-muted-foreground">From optional donations</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Event Summary</CardTitle>
                <CardDescription>Quick overview of your event performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Event Type</p>
                    <p className="text-muted-foreground capitalize">{event.eventType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Ticket Price</p>
                    <p className="text-muted-foreground">
                      {event.isFree ? "Free" : formatCurrency(parseFloat(event.ticketPrice || "0"), event.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Capacity</p>
                    <p className="text-muted-foreground">{event.capacity} attendees</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <Badge>{event.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <QrCodeIcon className="h-5 w-5" />
                  <CardTitle>Event QR Code</CardTitle>
                </div>
                <CardDescription>Share this QR code for members to register</CardDescription>
              </CardHeader>
              <CardContent>
                <QRCodeDisplay 
                  campaignName={event.title}
                  url={`${window.location.origin}/events/${eventId}`}
                />
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    Members can scan this code to access the event page and buy tickets
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets">
          <TicketTypesManager eventId={eventId} />
        </TabsContent>

        {/* Attendees Tab */}
        <TabsContent value="attendees">
          <Card>
            <CardHeader>
              <CardTitle>Attendees</CardTitle>
              <CardDescription>View all registered attendees for this event</CardDescription>
            </CardHeader>
            <CardContent>
              {registrations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No registrations yet
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Tickets</TableHead>
                        <TableHead>Amount Paid</TableHead>
                        <TableHead>QR Code</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrations.map((registration) => (
                        <TableRow key={registration.id} data-testid={`row-registration-${registration.id}`}>
                          <TableCell>
                            <div className="font-medium">
                              {registration.firstName} {registration.lastName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {registration.email}
                              </div>
                              {registration.phone && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {registration.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{registration.ticketCount}</Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              {formatCurrency(parseFloat(registration.totalPaid), event.currency)}
                            </div>
                            {parseFloat(registration.donationAmount || "0") > 0 && (
                              <div className="text-xs text-muted-foreground">
                                + {formatCurrency(parseFloat(registration.donationAmount || "0"), event.currency)} donation
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                              {registration.qrCode}
                            </code>
                          </TableCell>
                          <TableCell>
                            {registration.checkedIn ? (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Checked In
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <XCircle className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Promo Codes Tab */}
        <TabsContent value="promo-codes">
          <PromoCodesManager eventId={eventId} />
        </TabsContent>

        {/* Check-in Tab */}
        <TabsContent value="check-in">
          <div className="space-y-6">
            {/* Camera Scanner - Primary Method */}
            <Card className="border-2 border-primary">
              <CardHeader className="bg-primary/5">
                <div className="flex items-center gap-2">
                  <ScanLine className="h-5 w-5 text-primary" />
                  <CardTitle>📷 Camera Scanner</CardTitle>
                </div>
                <CardDescription>
                  Fast check-in: Point your camera at attendee's QR code for instant check-in
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <QRScanner 
                  onScan={handleCameraScan}
                  isProcessing={qrCheckInMutation.isPending}
                />
              </CardContent>
            </Card>

            {/* Manual Entry - Secondary Method */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <QrCodeIcon className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Manual Entry</CardTitle>
                </div>
                <CardDescription>Type the QR code if camera isn't available</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleQrCheckIn} className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Label htmlFor="qr-code" className="sr-only">QR Code</Label>
                      <div className="relative">
                        <QrCodeIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="qr-code"
                          type="text"
                          placeholder="Enter QR code (e.g., EVT-D4DF4963-MK2XW8IQ)"
                          value={qrCodeInput}
                          onChange={(e) => setQrCodeInput(e.target.value.toUpperCase())}
                          className="pl-9 font-mono"
                          data-testid="input-qr-code"
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      disabled={qrCheckInMutation.isPending || !qrCodeInput.trim()}
                      className="min-w-[120px]"
                      data-testid="button-qr-checkin"
                    >
                      {qrCheckInMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Check In
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* Last Check-in Confirmation */}
                  {lastCheckedIn && (
                    <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">
                          {lastCheckedIn.name}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Checked in at {lastCheckedIn.time.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{checkedInCount}</p>
                    <p className="text-sm text-muted-foreground">Checked In</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-500">{registrations.length - checkedInCount}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {registrations.length > 0 ? Math.round((checkedInCount / registrations.length) * 100) : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Attendee List for Manual Check-in */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Attendee List</CardTitle>
                    <CardDescription>Manually check in attendees or view status</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{registrations.length} registrations</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {registrations.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No registrations to check in yet
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>QR Code</TableHead>
                          <TableHead>Tickets</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {registrations.map((registration) => (
                          <TableRow 
                            key={registration.id}
                            className={registration.checkedIn ? "bg-green-50/50 dark:bg-green-950/20" : ""}
                          >
                            <TableCell className="font-medium">
                              {registration.firstName} {registration.lastName}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {registration.email}
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                {registration.qrCode}
                              </code>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{registration.ticketCount}</Badge>
                            </TableCell>
                            <TableCell>
                              {registration.checkedIn ? (
                                <div>
                                  <Badge variant="default" className="bg-green-600">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Checked In
                                  </Badge>
                                  {registration.checkedInAt && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {new Date(registration.checkedInAt).toLocaleTimeString()}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <Badge variant="secondary">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {!registration.checkedIn && (
                                <Button
                                  size="sm"
                                  onClick={() => checkInMutation.mutate(registration.id)}
                                  disabled={checkInMutation.isPending}
                                  data-testid={`button-checkin-${registration.id}`}
                                >
                                  {checkInMutation.isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    "Check In"
                                  )}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
