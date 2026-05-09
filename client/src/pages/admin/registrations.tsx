import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle2, XCircle, Eye, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface OrganizationRegistration {
  id: string;
  charityName: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  timezone?: string;
  currency?: string;
  dateFormat?: string;
  incorporationDocUrl: string;
  status: string;
  submittedAt: string;
  createdAt: string;
}

export default function AdminRegistrationsPage() {
  const { toast } = useToast();
  const [selectedRegistration, setSelectedRegistration] = useState<OrganizationRegistration | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("submitted");

  const { data: registrations, isLoading } = useQuery<OrganizationRegistration[]>({
    queryKey: ["/api/admin/registrations", { status: statusFilter }],
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/admin/registrations/${id}/approve`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/registrations"] });
      toast({
        title: "Registration approved",
        description: "The organization has been approved and will receive an email.",
      });
      setShowApproveDialog(false);
      setSelectedRegistration(null);
    },
    onError: (error: any) => {
      toast({
        title: "Approval failed",
        description: error.message || "Failed to approve registration",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await apiRequest("POST", `/api/admin/registrations/${id}/reject`, { reason });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/registrations"] });
      toast({
        title: "Registration rejected",
        description: "The organization has been notified of the rejection.",
      });
      setShowRejectDialog(false);
      setSelectedRegistration(null);
      setRejectionReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Rejection failed",
        description: error.message || "Failed to reject registration",
        variant: "destructive",
      });
    },
  });

  const handleApprove = () => {
    if (!selectedRegistration) return;
    approveMutation.mutate(selectedRegistration.id);
  };

  const handleReject = () => {
    if (!selectedRegistration || !rejectionReason.trim()) {
      toast({
        title: "Rejection reason required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }
    rejectMutation.mutate({ id: selectedRegistration.id, reason: rejectionReason });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge variant="secondary" data-testid={`status-${status}`}>Pending Review</Badge>;
      case "approved":
        return <Badge className="bg-green-600 hover:bg-green-700" data-testid={`status-${status}`}>Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" data-testid={`status-${status}`}>Rejected</Badge>;
      default:
        return <Badge variant="outline" data-testid={`status-${status}`}>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl" data-testid="text-admin-title">
            Organization Registrations
          </CardTitle>
          <CardDescription>
            Review and approve new organization applications
          </CardDescription>
          <div className="flex gap-2 mt-4">
            <Button
              variant={statusFilter === "submitted" ? "default" : "outline"}
              onClick={() => setStatusFilter("submitted")}
              data-testid="filter-submitted"
            >
              Pending ({registrations?.filter(r => r.status === "submitted").length || 0})
            </Button>
            <Button
              variant={statusFilter === "approved" ? "default" : "outline"}
              onClick={() => setStatusFilter("approved")}
              data-testid="filter-approved"
            >
              Approved
            </Button>
            <Button
              variant={statusFilter === "rejected" ? "default" : "outline"}
              onClick={() => setStatusFilter("rejected")}
              data-testid="filter-rejected"
            >
              Rejected
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations && registrations.length > 0 ? (
                registrations.map((registration) => (
                  <TableRow key={registration.id} data-testid={`row-registration-${registration.id}`}>
                    <TableCell className="font-medium" data-testid={`text-charity-name-${registration.id}`}>
                      {registration.charityName}
                    </TableCell>
                    <TableCell>
                      <div data-testid={`text-contact-${registration.id}`}>
                        {registration.contactFirstName} {registration.contactLastName}
                      </div>
                      <div className="text-sm text-muted-foreground" data-testid={`text-email-${registration.id}`}>
                        {registration.contactEmail}
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-submitted-${registration.id}`}>
                      {registration.submittedAt
                        ? formatDistanceToNow(new Date(registration.submittedAt), { addSuffix: true })
                        : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(registration.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRegistration(registration);
                            setShowDetailsDialog(true);
                          }}
                          data-testid={`button-view-${registration.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {registration.status === "submitted" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRegistration(registration);
                                setShowApproveDialog(true);
                              }}
                              data-testid={`button-approve-${registration.id}`}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRegistration(registration);
                                setShowRejectDialog(true);
                              }}
                              data-testid={`button-reject-${registration.id}`}
                            >
                              <XCircle className="w-4 h-4 mr-1 text-red-600" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No registrations found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle data-testid="text-details-title">Registration Details</DialogTitle>
            <DialogDescription>
              Review the organization's registration information
            </DialogDescription>
          </DialogHeader>
          {selectedRegistration && (
            <div className="space-y-4">
              <div>
                <Label>Organization Name</Label>
                <p className="text-lg" data-testid="text-details-charity-name">{selectedRegistration.charityName}</p>
              </div>
              <div>
                <Label>Contact Person</Label>
                <p data-testid="text-details-contact">
                  {selectedRegistration.contactFirstName} {selectedRegistration.contactLastName}
                </p>
                <p className="text-sm text-muted-foreground" data-testid="text-details-email">
                  {selectedRegistration.contactEmail}
                </p>
                {selectedRegistration.contactPhone && (
                  <p className="text-sm text-muted-foreground" data-testid="text-details-phone">
                    {selectedRegistration.contactPhone}
                  </p>
                )}
              </div>
              <div>
                <Label>Address</Label>
                <p data-testid="text-details-address">
                  {selectedRegistration.street}<br />
                  {selectedRegistration.city}, {selectedRegistration.state} {selectedRegistration.zip}<br />
                  {selectedRegistration.country}
                </p>
              </div>
              
              {(selectedRegistration.timezone || selectedRegistration.currency || selectedRegistration.dateFormat) && (
                <div className="bg-muted p-4 rounded-lg">
                  <Label className="mb-2 block">Regional Settings</Label>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    {selectedRegistration.timezone && (
                      <div>
                        <p className="text-muted-foreground mb-1">Timezone</p>
                        <p className="font-medium" data-testid="text-details-timezone">{selectedRegistration.timezone}</p>
                      </div>
                    )}
                    {selectedRegistration.currency && (
                      <div>
                        <p className="text-muted-foreground mb-1">Currency</p>
                        <p className="font-medium" data-testid="text-details-currency">{selectedRegistration.currency}</p>
                      </div>
                    )}
                    {selectedRegistration.dateFormat && (
                      <div>
                        <p className="text-muted-foreground mb-1">Date Format</p>
                        <p className="font-medium" data-testid="text-details-date-format">{selectedRegistration.dateFormat}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <Label>Incorporation Document</Label>
                {selectedRegistration.incorporationDocUrl ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Document uploaded</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Convert object path to API URL
                        let docUrl = selectedRegistration.incorporationDocUrl;
                        
                        console.log("Document URL from registration:", docUrl);
                        
                        // Handle various URL formats that might be stored
                        if (!docUrl || docUrl.trim() === '') {
                          toast({
                            title: "Error",
                            description: "Document URL is missing",
                            variant: "destructive",
                          });
                          return;
                        }
                        
                        // Check if it's the upload endpoint URL or path (this is wrong)
                        if (docUrl.includes('/api/files/upload') || 
                            docUrl.includes('/upload') && !docUrl.includes('/uploads/') ||
                            docUrl === '/upload' || 
                            docUrl === 'upload') {
                          toast({
                            title: "Error",
                            description: "Invalid document URL detected. The file may not have been uploaded correctly. Please ask the organization to re-upload their document.",
                            variant: "destructive",
                          });
                          console.error("Invalid document URL (upload endpoint):", docUrl);
                          return;
                        }
                        
                        // If it's already a full URL, use it as-is (but check it's not the upload endpoint)
                        if (docUrl.startsWith('http://') || docUrl.startsWith('https://')) {
                          window.open(docUrl, '_blank');
                          return;
                        }
                        
                        // If it starts with /objects/, convert to /api/files/objects/...
                        if (docUrl.startsWith('/objects/')) {
                          // Ensure it's not just /objects/upload
                          if (docUrl === '/objects/upload' || docUrl.startsWith('/objects/upload/')) {
                            toast({
                              title: "Error",
                              description: "Invalid document path. Please contact support.",
                              variant: "destructive",
                            });
                            console.error("Invalid document path:", docUrl);
                            return;
                          }
                          window.open(`/api/files${docUrl}`, '_blank');
                          return;
                        }
                        
                        // If it already starts with /api/files, use as-is
                        if (docUrl.startsWith('/api/files')) {
                          window.open(docUrl, '_blank');
                          return;
                        }
                        
                        // If it doesn't start with /, assume it needs /objects/ prefix
                        if (!docUrl.startsWith('/')) {
                          window.open(`/api/files/objects/${docUrl}`, '_blank');
                          return;
                        }
                        
                        // Last resort: try with /api/files prefix
                        window.open(`/api/files${docUrl}`, '_blank');
                      }}
                      data-testid="button-view-document"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Document
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No document uploaded</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)} data-testid="button-close-details">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle data-testid="text-approve-title">Approve Registration</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve <strong>{selectedRegistration?.charityName}</strong>?
              They will receive an email with instructions to set up their account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)} data-testid="button-cancel-approve">
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={approveMutation.isPending}
              data-testid="button-confirm-approve"
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                "Approve"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle data-testid="text-reject-title">Reject Registration</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting <strong>{selectedRegistration?.charityName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejectionReason">Rejection Reason</Label>
            <Textarea
              id="rejectionReason"
              data-testid="textarea-rejection-reason"
              placeholder="Explain why this registration is being rejected..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mt-2"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRejectDialog(false);
              setRejectionReason("");
            }} data-testid="button-cancel-reject">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
