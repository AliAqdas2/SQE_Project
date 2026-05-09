import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  GraduationCap,
  Users,
  Calendar,
  Coins,
  Edit,
  Download,
  CheckCircle,
  Mail,
  Phone,
  BarChart,
  Loader2,
  Clock,
  Share2,
  QrCode as QrCodeIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { QRCodeDisplay } from "@/components/qr-code-display";
import { CardDescription } from "@/components/ui/card";

interface Activity {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  teacher: string | null;
  isPaid: boolean;
  price: string;
  currency: string | null;
  maxStudents: number | null;
  currentStudents: number;
  scheduleType: string;
  startDate: Date | null;
  endDate: Date | null;
  isPublished: boolean;
}

interface Registration {
  id: string;
  activityId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string | null;
  parentName: string | null;
  parentEmail: string | null;
  parentPhone: string | null;
  status: string;
  stripePaymentId: string | null;
  createdAt: Date;
}

export default function ManageActivityPage() {
  const [_, params] = useRoute("/dashboard/activities/:id");
  const [__, setLocation] = useLocation();
  const activityId = params?.id;
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Get organization for slug
  const { data: session } = useQuery<{ user: { orgId: string } }>({
    queryKey: ["/api/auth/session"],
  });

  const { data: organization } = useQuery<{ slug: string }>({
    queryKey: ["/api/organization"],
    enabled: !!session?.user?.orgId,
  });

  // Set social sharing meta tags when activity data is available
  useEffect(() => {
    if (!activity) return;

    const activityUrl = organization?.slug 
      ? `${window.location.origin}/a/${organization.slug}/${activityId}`
      : `${window.location.origin}/activities/${activityId}`;
    const activityTitle = activity.title;
    const activityDescription = activity.description 
      ? activity.description.substring(0, 200) 
      : `Join ${activity.title} - ${activity.category || "Activity"}`;
    const ogImage = activity.imageUrl || undefined;
    const keywords = [activity.title, activity.category, activity.teacher].filter(Boolean).join(", ");

    // Set Open Graph tags
    const setMetaTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("property", property);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    setMetaTag("og:title", activityTitle);
    setMetaTag("og:description", activityDescription);
    setMetaTag("og:url", activityUrl);
    if (ogImage) {
      setMetaTag("og:image", ogImage);
      setMetaTag("og:image:width", "1200");
      setMetaTag("og:image:height", "630");
      setMetaTag("og:image:type", "image/jpeg");
    }
    setMetaTag("og:keywords", keywords);
    setMetaTag("og:type", "website");
    setMetaTag("og:site_name", "Plegit");

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
    setTwitterMeta("twitter:title", activityTitle);
    setTwitterMeta("twitter:description", activityDescription);
    if (ogImage) {
      setTwitterMeta("twitter:image", ogImage);
    }
  }, [activity, activityId, organization?.slug]);

  const { data: activity, isLoading: activityLoading } = useQuery<Activity>({
    queryKey: ["/api/activities", activityId],
    enabled: !!activityId,
  });

  const { data: registrations = [], isLoading: registrationsLoading } = useQuery<Registration[]>({
    queryKey: ["/api/activities", activityId, "registrations"],
    enabled: !!activityId,
  });

  const deleteActivityMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/activities/${activityId}`);
    },
    onSuccess: () => {
      toast({
        title: "Activity Deleted",
        description: "The activity has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setLocation("/dashboard/activities");
    },
    onError: () => {
      toast({
        title: "Deletion Failed",
        description: "Failed to delete activity. Please try again.",
        variant: "destructive",
      });
    },
  });

  const exportCSV = () => {
    if (!registrations.length) return;

    const headers = ["Student Name", "Student Email", "Student Phone", "Parent Name", "Parent Email", "Parent Phone", "Status", "Registration Date"];
    const rows = registrations.map(r => [
      r.studentName,
      r.studentEmail,
      r.studentPhone || "",
      r.parentName || "",
      r.parentEmail || "",
      r.parentPhone || "",
      r.status,
      new Date(r.createdAt).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-${activityId}-registrations.csv`;
    a.click();

    toast({
      title: "Export Successful",
      description: "Registrations exported to CSV.",
    });
  };

  if (activityLoading || registrationsLoading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="p-4 md:p-8">
        <p className="text-muted-foreground">Activity not found</p>
      </div>
    );
  }

  const currencySymbol = {
    USD: "$",
    GBP: "£",
    EUR: "€",
    AED: "AED ",
  }[activity.currency || "USD"] || "$";

  const totalRevenue = activity.isPaid 
    ? registrations.filter(r => r.status === "confirmed").length * parseFloat(activity.price)
    : 0;

  const filteredRegistrations = registrations.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        r.studentName.toLowerCase().includes(query) ||
        r.studentEmail.toLowerCase().includes(query) ||
        r.parentName?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold truncate" data-testid="text-activity-title">{activity.title}</h1>
          <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2 text-xs md:text-sm text-muted-foreground">
            {activity.teacher && (
              <div className="flex items-center gap-1">
                <GraduationCap className="h-3 w-3 md:h-4 md:w-4" />
                {activity.teacher}
              </div>
            )}
            {activity.category && (
              <Badge variant="outline">{activity.category}</Badge>
            )}
            <Badge variant={activity.isPublished ? "default" : "secondary"}>
              {activity.isPublished ? "Published" : "Draft"}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href={`/dashboard/activities/${activityId}/edit`} className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full" data-testid="button-edit">
              <Edit className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Edit</span>
            </Button>
          </Link>
          <Button variant="outline" onClick={exportCSV} className="flex-1 sm:flex-none" data-testid="button-export">
            <Download className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Export CSV</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BarChart className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger value="registrations" data-testid="tab-registrations">
            <Users className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Registrations</span>
            <span className="sm:hidden">Students</span>
          </TabsTrigger>
          <TabsTrigger value="share" data-testid="tab-share">
            <Share2 className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Share Activity</span>
            <span className="sm:hidden">Share</span>
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">
            <Edit className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Settings</span>
            <span className="sm:hidden">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 md:space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold" data-testid="text-total-students">
                  {activity.currentStudents}
                </div>
                {activity.maxStudents && (
                  <p className="text-xs text-muted-foreground">
                    {activity.currentStudents} / {activity.maxStudents} capacity
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold" data-testid="text-total-registrations">
                  {registrations.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {registrations.filter(r => r.status === "confirmed").length} confirmed
                </p>
              </CardContent>
            </Card>

            {activity.isPaid && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue Collected</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl md:text-2xl font-bold" data-testid="text-revenue">
                    {currencySymbol}{totalRevenue.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currencySymbol}{activity.price} per student
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2 p-0 h-auto text-xs"
                    onClick={() => navigate(`/dashboard/activities/${activityId}/payments`)}
                    data-testid="button-view-payments"
                  >
                    View all payments →
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-base md:text-lg font-bold capitalize" data-testid="text-schedule">
                  {activity.scheduleType.replace('_', ' ')}
                </div>
                {activity.startDate && (
                  <p className="text-xs text-muted-foreground">
                    Starts {new Date(activity.startDate).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {activity.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm md:text-base text-muted-foreground whitespace-pre-wrap">{activity.description}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="registrations" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredRegistrations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 md:py-16 px-4">
                <Users className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg md:text-xl font-semibold mb-2 text-center">
                  {registrations.length === 0 ? "No Registrations Yet" : "No registrations match your filters"}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground text-center">
                  {registrations.length === 0 
                    ? "Students will appear here once they register for this activity."
                    : "Try adjusting your search or filter criteria."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRegistrations.map((registration) => (
                <Card key={registration.id} data-testid={`card-registration-${registration.id}`}>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-base md:text-lg truncate" data-testid={`text-student-name-${registration.id}`}>
                          {registration.studentName}
                        </CardTitle>
                        <Badge
                          variant={registration.status === "confirmed" ? "default" : "secondary"}
                          data-testid={`badge-status-${registration.id}`}
                          className="mt-1 w-fit"
                        >
                          {registration.status}
                        </Badge>
                      </div>
                      <div className="text-xs md:text-sm text-muted-foreground">
                        Registered {new Date(registration.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <h4 className="text-xs md:text-sm font-semibold">Student Information</h4>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                            <Mail className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
                            <span className="truncate">{registration.studentEmail}</span>
                          </div>
                          {registration.studentPhone && (
                            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                              <Phone className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
                              <span className="truncate">{registration.studentPhone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {(registration.parentName || registration.parentEmail) && (
                        <div className="space-y-2">
                          <h4 className="text-xs md:text-sm font-semibold">Parent/Guardian Information</h4>
                          <div className="space-y-1">
                            {registration.parentName && (
                              <p className="text-xs md:text-sm text-muted-foreground">{registration.parentName}</p>
                            )}
                            {registration.parentEmail && (
                              <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                                <Mail className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
                                <span className="truncate">{registration.parentEmail}</span>
                              </div>
                            )}
                            {registration.parentPhone && (
                              <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                                <Phone className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
                                <span className="truncate">{registration.parentPhone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="share" className="space-y-4 md:space-y-6">
          {activity && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>QR Code</CardTitle>
                  <CardDescription>
                    Download or share this QR code for easy registration
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                  <QRCodeDisplay
                    campaignName={activity.title}
                    url={organization?.slug 
                      ? `${window.location.origin}/a/${organization.slug}/${activityId}`
                      : `${window.location.origin}/activities/${activityId}`
                    }
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Share on Social Media</CardTitle>
                  <CardDescription>
                    Share this activity on social platforms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const url = organization?.slug 
                          ? `${window.location.origin}/a/${organization.slug}/${activityId}`
                          : `${window.location.origin}/activities/${activityId}`;
                        const quote = encodeURIComponent(`${activity.title} - ${activity.description?.substring(0, 100) || ""}`);
                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${quote}`, '_blank');
                      }}
                      data-testid="button-share-facebook"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Facebook
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const url = organization?.slug 
                          ? `${window.location.origin}/a/${organization.slug}/${activityId}`
                          : `${window.location.origin}/activities/${activityId}`;
                        const text = encodeURIComponent(`${activity.title} - ${activity.description?.substring(0, 100) || ""}`);
                        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank');
                      }}
                      data-testid="button-share-twitter"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Twitter
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const url = organization?.slug 
                          ? `${window.location.origin}/a/${organization.slug}/${activityId}`
                          : `${window.location.origin}/activities/${activityId}`;
                        const title = encodeURIComponent(activity.title);
                        const summary = encodeURIComponent(activity.description?.substring(0, 200) || "");
                        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${title}&summary=${summary}`, '_blank');
                      }}
                      data-testid="button-share-linkedin"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      LinkedIn
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const url = organization?.slug 
                          ? `${window.location.origin}/a/${organization.slug}/${activityId}`
                          : `${window.location.origin}/activities/${activityId}`;
                        const text = encodeURIComponent(`${activity.title} - ${activity.description?.substring(0, 100) || ""}`);
                        window.open(`https://wa.me/?text=${text}%20${encodeURIComponent(url)}`, '_blank');
                      }}
                      data-testid="button-share-whatsapp"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const url = organization?.slug 
                          ? `${window.location.origin}/a/${organization.slug}/${activityId}`
                          : `${window.location.origin}/activities/${activityId}`;
                        const subject = encodeURIComponent(activity.title);
                        const body = encodeURIComponent(`${activity.description || ""}\n\n${url}`);
                        window.location.href = `mailto:?subject=${subject}&body=${body}`;
                      }}
                      data-testid="button-share-email"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        const url = organization?.slug 
                          ? `${window.location.origin}/a/${organization.slug}/${activityId}`
                          : `${window.location.origin}/activities/${activityId}`;
                        if (navigator.share) {
                          try {
                            await navigator.share({
                              title: activity.title,
                              text: activity.description || "",
                              url,
                            });
                          } catch (error) {
                            // User cancelled
                          }
                        } else {
                          await navigator.clipboard.writeText(url);
                          toast({
                            title: "Link Copied",
                            description: "Activity link copied to clipboard!",
                          });
                        }
                      }}
                      data-testid="button-share-native"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <Label className="text-sm font-medium mb-2 block">Activity URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={organization?.slug 
                          ? `${window.location.origin}/a/${organization.slug}/${activityId}`
                          : `${window.location.origin}/activities/${activityId}`
                        }
                        readOnly
                        className="font-mono text-sm"
                        data-testid="input-activity-url"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const url = organization?.slug 
                            ? `${window.location.origin}/a/${organization.slug}/${activityId}`
                            : `${window.location.origin}/activities/${activityId}`;
                          await navigator.clipboard.writeText(url);
                          toast({
                            title: "Copied",
                            description: "URL copied to clipboard",
                          });
                        }}
                        data-testid="button-copy-url"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-destructive rounded-lg">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold">Delete Activity</h3>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete this activity and all associated data
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this activity? This action cannot be undone.")) {
                      deleteActivityMutation.mutate();
                    }
                  }}
                  disabled={deleteActivityMutation.isPending}
                  data-testid="button-delete"
                  className="w-full sm:w-auto shrink-0"
                >
                  {deleteActivityMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Delete Activity
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
