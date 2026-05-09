import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Phone, MapPin, Edit, ArrowLeft, Coins, Heart, Calendar, FileText, MessageSquare, Upload, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";
import type { Beneficiary, BeneficiaryDonation, BeneficiaryCommunication } from "@shared/schema";
import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface SessionResponse {
  user: { orgId: string };
}

export default function BeneficiaryDetailPage() {
  const { formatCurrency } = useOrganizationLocale();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/dashboard/beneficiaries/:id");
  const { toast } = useToast();
  const beneficiaryId = params?.id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const { data: session } = useQuery<SessionResponse>({
    queryKey: ["/api/auth/session"],
  });

  const orgId = session?.user?.orgId;

  const { data: beneficiary, isLoading, refetch: refetchBeneficiary } = useQuery<Beneficiary>({
    queryKey: [`/api/org/${orgId}/beneficiaries/${beneficiaryId}`],
    enabled: !!beneficiaryId && !!orgId,
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orgId || !beneficiaryId) return;

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch(`/api/org/${orgId}/beneficiaries/${beneficiaryId}/upload-photo`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to upload photo");
      }

      const { url } = await response.json();
      await refetchBeneficiary();
      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload photo",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const { data: donations = [] } = useQuery<BeneficiaryDonation[]>({
    queryKey: [`/api/beneficiaries/${beneficiaryId}/donations`],
    enabled: !!beneficiaryId && !!orgId,
  });

  const { data: communications = [] } = useQuery<BeneficiaryCommunication[]>({
    queryKey: [`/api/beneficiaries/${beneficiaryId}/communications`],
    enabled: !!beneficiaryId && !!orgId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!beneficiary) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Beneficiary not found</p>
            <Button onClick={() => navigate("/dashboard/beneficiaries")} className="mt-4" data-testid="button-back-not-found">
              Back to Beneficiaries
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getDisplayName = () => {
    if (beneficiary.type === "organization") {
      return beneficiary.organizationName || "Unnamed Organization";
    }
    return `${beneficiary.firstName || ""} ${beneficiary.lastName || ""}`.trim() || "Unnamed Individual";
  };

  const getInitials = () => {
    if (beneficiary.type === "organization") {
      return beneficiary.organizationName?.charAt(0).toUpperCase() || "O";
    }
    const first = beneficiary.firstName?.charAt(0) || "";
    const last = beneficiary.lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "B";
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case "critical": return "destructive";
      case "high": return "default";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/dashboard/beneficiaries")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold flex-1">Beneficiary Profile</h1>
        <Button
          onClick={() => navigate(`/dashboard/beneficiaries/${beneficiary.id}/edit`)}
          data-testid="button-edit"
        >
          <Edit className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Edit</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate(`/dashboard/beneficiaries/${beneficiary.id}/report`)}
          data-testid="button-report"
        >
          <FileText className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Report</span>
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 md:h-32 md:w-32">
                <AvatarImage src={beneficiary.photoUrl || undefined} />
                <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
              </Avatar>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center cursor-pointer"
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <Upload className="w-8 h-8 text-white" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold" data-testid="text-name">
                  {getDisplayName()}
                </h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant={getUrgencyColor(beneficiary.urgencyLevel)} data-testid="badge-urgency">
                    {beneficiary.urgencyLevel} urgency
                  </Badge>
                  <Badge variant="outline" data-testid="badge-type">
                    {beneficiary.type}
                  </Badge>
                  <Badge variant={beneficiary.status === "active" ? "default" : "secondary"} data-testid="badge-status">
                    {beneficiary.status}
                  </Badge>
                </div>
              </div>
              
              <div className="grid gap-2 sm:grid-cols-2">
                {beneficiary.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span data-testid="text-email">{beneficiary.email}</span>
                  </div>
                )}
                {beneficiary.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span data-testid="text-phone">{beneficiary.phone}</span>
                  </div>
                )}
                {(beneficiary.city || beneficiary.state) && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {beneficiary.city}{beneficiary.city && beneficiary.state && ", "}{beneficiary.state}
                    </span>
                  </div>
                )}
              </div>

              {beneficiary.bio && (
                <p className="text-sm text-muted-foreground" data-testid="text-bio">{beneficiary.bio}</p>
              )}

              {beneficiary.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {beneficiary.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
              <div className="text-center md:text-right">
                <p className="text-2xl font-bold" data-testid="text-total-donations">
                  {formatCurrency(parseFloat(beneficiary.totalDonationsReceived || "0"))}
                </p>
                <p className="text-sm text-muted-foreground">Total Received</p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-2xl font-bold" data-testid="text-total-gifts">{beneficiary.totalGiftsReceived}</p>
                <p className="text-sm text-muted-foreground">Total Gifts</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="details" data-testid="tabs-beneficiary">
        <TabsList className="grid w-full grid-cols-3" data-testid="tabs-list">
          <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
          <TabsTrigger value="donations" data-testid="tab-donations">Donations ({donations.length})</TabsTrigger>
          <TabsTrigger value="communications" data-testid="tab-communications">Communications ({communications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {beneficiary.firstSupportDate && (
                  <div>
                    <p className="text-sm font-medium">First Support Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(beneficiary.firstSupportDate), "MMMM d, yyyy")}
                    </p>
                  </div>
                )}
                {beneficiary.lastSupportDate && (
                  <div>
                    <p className="text-sm font-medium">Last Support Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(beneficiary.lastSupportDate), "MMMM d, yyyy")}
                    </p>
                  </div>
                )}
                {beneficiary.story && (
                  <div>
                    <p className="text-sm font-medium">Story</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-story">{beneficiary.story}</p>
                  </div>
                )}
                {beneficiary.healthInfo && (
                  <div>
                    <p className="text-sm font-medium">Health Information</p>
                    <p className="text-sm text-muted-foreground">{beneficiary.healthInfo}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Needs & Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {beneficiary.needs && beneficiary.needs.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Current Needs</p>
                    <div className="flex flex-wrap gap-2">
                      {beneficiary.needs.map((need, i) => (
                        <Badge key={i} variant="outline">{need}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="donations">
          <Card>
            <CardHeader>
              <CardTitle>Donation History</CardTitle>
            </CardHeader>
            <CardContent>
              {donations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No donations recorded yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {donations.map((donation) => (
                    <div key={donation.id} className="flex items-start justify-between p-4 rounded-md border" data-testid={`donation-${donation.id}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{formatCurrency(parseFloat(donation.amount || "0"))}</p>
                          <Badge variant="outline" className="text-xs">{donation.donationType}</Badge>
                        </div>
                        {donation.description && (
                          <p className="text-sm text-muted-foreground mb-1">{donation.description}</p>
                        )}
                        {donation.deliveredBy && (
                          <p className="text-xs text-muted-foreground">Delivered by: {donation.deliveredBy}</p>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {donation.deliveryDate ? format(new Date(donation.deliveryDate), "MMM d, yyyy") : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communications">
          <Card>
            <CardHeader>
              <CardTitle>Communication Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {communications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No communications recorded yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {communications.map((comm) => (
                    <div key={comm.id} className="p-4 rounded-md border" data-testid={`communication-${comm.id}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{comm.type}</Badge>
                          {comm.requiresFollowUp && (
                            <Badge variant="destructive" className="text-xs">Follow-up needed</Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(comm.communicationDate), "MMM d, yyyy")}
                        </span>
                      </div>
                      {comm.subject && (
                        <p className="font-medium mb-1">{comm.subject}</p>
                      )}
                      <p className="text-sm text-muted-foreground">{comm.content}</p>
                      {comm.staffMember && (
                        <p className="text-xs text-muted-foreground mt-2">By: {comm.staffMember}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
