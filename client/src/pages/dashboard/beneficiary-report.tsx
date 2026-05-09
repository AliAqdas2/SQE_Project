import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Printer } from "lucide-react";
import { format } from "date-fns";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";

interface Beneficiary {
  id: string;
  type: string;
  firstName: string | null;
  lastName: string | null;
  organizationName: string | null;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  status: string;
  urgencyLevel: string;
  totalDonationsReceived: string;
  totalGiftsReceived: number;
  firstSupportDate: string | null;
  lastSupportDate: string | null;
  tags: string[];
  bio: string | null;
  story: string | null;
  healthInfo: string | null;
  needs: string[];
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
}

interface BeneficiaryDonation {
  id: string;
  donationDate: string;
  amount: string;
  type: string;
  description: string | null;
  donorInfo: string | null;
  notes: string | null;
}

interface BeneficiaryCommunication {
  id: string;
  type: string;
  subject: string | null;
  content: string;
  communicationDate: string;
  staffMember: string | null;
  requiresFollowUp: boolean;
  followUpDate: string | null;
}

interface SessionResponse {
  user: { orgId: string };
}

export default function BeneficiaryReportPage() {
  const { formatCurrency } = useOrganizationLocale();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/dashboard/beneficiaries/:id/report");
  const beneficiaryId = params?.id;

  const { data: session } = useQuery<SessionResponse>({
    queryKey: ["/api/auth/session"],
  });

  const orgId = session?.user?.orgId;

  const { data: beneficiary, isLoading } = useQuery<Beneficiary>({
    queryKey: [`/api/org/${orgId}/beneficiaries/${beneficiaryId}`],
    enabled: !!beneficiaryId && !!orgId,
  });

  const { data: donations = [] } = useQuery<BeneficiaryDonation[]>({
    queryKey: [`/api/beneficiaries/${beneficiaryId}/donations`],
    enabled: !!beneficiaryId && !!orgId,
  });

  const { data: communications = [] } = useQuery<BeneficiaryCommunication[]>({
    queryKey: [`/api/beneficiaries/${beneficiaryId}/communications`],
    enabled: !!beneficiaryId && !!orgId,
  });

  const handlePrint = () => {
    window.print();
  };

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

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-4 print:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(`/dashboard/beneficiaries/${beneficiaryId}`)}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold flex-1">Beneficiary Report</h1>
        <Button onClick={handlePrint} variant="outline" data-testid="button-print">
          <Printer className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Print</span>
        </Button>
      </div>

      <div className="print:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Beneficiary Comprehensive Report</h1>
          <p className="text-muted-foreground">Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Beneficiary Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-base font-semibold">{getDisplayName()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <p className="text-base">{beneficiary.type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={beneficiary.status === "active" ? "default" : "secondary"}>
                  {beneficiary.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Urgency Level</p>
                <Badge variant={beneficiary.urgencyLevel === "critical" ? "destructive" : "outline"}>
                  {beneficiary.urgencyLevel}
                </Badge>
              </div>
            </div>

            {beneficiary.email && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-base">{beneficiary.email}</p>
              </div>
            )}

            {beneficiary.phone && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p className="text-base">{beneficiary.phone}</p>
              </div>
            )}

            {(beneficiary.street || beneficiary.city || beneficiary.state) && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p className="text-base">
                  {beneficiary.street && <>{beneficiary.street}<br /></>}
                  {beneficiary.city}{beneficiary.city && beneficiary.state && ", "}{beneficiary.state} {beneficiary.zip}
                  {beneficiary.country && <><br />{beneficiary.country}</>}
                </p>
              </div>
            )}

            {beneficiary.bio && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bio</p>
                <p className="text-base">{beneficiary.bio}</p>
              </div>
            )}

            {beneficiary.story && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Story</p>
                <p className="text-base">{beneficiary.story}</p>
              </div>
            )}

            {beneficiary.healthInfo && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Health Information</p>
                <p className="text-base">{beneficiary.healthInfo}</p>
              </div>
            )}

            {beneficiary.needs && beneficiary.needs.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Current Needs</p>
                <div className="flex flex-wrap gap-2">
                  {beneficiary.needs.map((need, idx) => (
                    <Badge key={idx} variant="outline">{need}</Badge>
                  ))}
                </div>
              </div>
            )}

            {beneficiary.tags && beneficiary.tags.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {beneficiary.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Support Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(parseFloat(beneficiary.totalDonationsReceived || "0"))}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Total Received</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{beneficiary.totalGiftsReceived}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Gifts</p>
              </div>
              <div className="text-center">
                <p className="text-base font-semibold">
                  {beneficiary.firstSupportDate ? format(new Date(beneficiary.firstSupportDate), "MMM d, yyyy") : "N/A"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">First Support</p>
              </div>
              <div className="text-center">
                <p className="text-base font-semibold">
                  {beneficiary.lastSupportDate ? format(new Date(beneficiary.lastSupportDate), "MMM d, yyyy") : "N/A"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Last Support</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {donations.length > 0 && (
          <Card className="mb-6 break-inside-avoid">
            <CardHeader>
              <CardTitle>Donation History ({donations.length} donations)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {donations.map((donation, idx) => (
                  <div key={donation.id}>
                    {idx > 0 && <Separator className="my-3" />}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{formatCurrency(parseFloat(donation.amount))}</p>
                          <Badge variant="outline" className="text-xs">{donation.type}</Badge>
                        </div>
                        {donation.description && (
                          <p className="text-sm text-muted-foreground mb-1">{donation.description}</p>
                        )}
                        {donation.donorInfo && (
                          <p className="text-xs text-muted-foreground">Donor: {donation.donorInfo}</p>
                        )}
                        {donation.notes && (
                          <p className="text-xs text-muted-foreground italic mt-1">Note: {donation.notes}</p>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {format(new Date(donation.donationDate), "MMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {communications.length > 0 && (
          <Card className="break-inside-avoid">
            <CardHeader>
              <CardTitle>Communication Timeline ({communications.length} records)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {communications.map((comm, idx) => (
                  <div key={comm.id}>
                    {idx > 0 && <Separator className="my-3" />}
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
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
                        <p className="font-medium">{comm.subject}</p>
                      )}
                      <p className="text-sm text-muted-foreground">{comm.content}</p>
                      {comm.staffMember && (
                        <p className="text-xs text-muted-foreground">By: {comm.staffMember}</p>
                      )}
                      {comm.followUpDate && (
                        <p className="text-xs text-muted-foreground">
                          Follow-up due: {format(new Date(comm.followUpDate), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground print:block">
          <p>This report is confidential and intended for internal use only.</p>
          <p className="mt-1">Report generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
        </div>
      </div>
    </div>
  );
}
