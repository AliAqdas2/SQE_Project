import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Heart, Search, Check, X, Trash2, Pin, MessageCircle, Filter, TrendingUp } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PrayerRequest {
  id: string;
  orgId: string;
  submitterName: string | null;
  submitterEmail: string | null;
  isAnonymous: boolean;
  requestText: string;
  category: string | null;
  status: string;
  moderationStatus: string;
  moderationNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  aiSuggestions: {
    isAppropriate?: boolean;
    flagReason?: string | null;
    suggestedCategory?: string;
    sentiment?: string;
    moderationNotes?: string;
  };
  isPublic: boolean;
  isPinned: boolean;
  prayerCount: number;
  isAnswered: boolean;
  answeredAt: string | null;
  answeredNote: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SessionResponse {
  user: {
    id: string;
    orgId: string;
  };
}

export default function PrayerWallPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [moderationFilter, setModerationFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<PrayerRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [isAnswerDialogOpen, setIsAnswerDialogOpen] = useState(false);
  const [answeredNote, setAnsweredNote] = useState("");
  const [deleteRequestId, setDeleteRequestId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: session } = useQuery<SessionResponse>({
    queryKey: ["/api/auth/session"],
  });

  const orgId = session?.user?.orgId;

  const queryParams = new URLSearchParams();
  if (statusFilter !== "all") queryParams.append("status", statusFilter);
  if (moderationFilter !== "all") queryParams.append("moderationStatus", moderationFilter);
  const queryString = queryParams.toString();

  const { data: requests, isLoading } = useQuery<PrayerRequest[]>({
    queryKey: [`/api/org/${orgId}/prayer-requests${queryString ? `?${queryString}` : ""}`],
    enabled: !!orgId,
  });

  const requestList = requests || [];

  // Calculate stats
  const stats = {
    total: requestList.length,
    pending: requestList.filter(r => r.status === "pending").length,
    approved: requestList.filter(r => r.status === "approved").length,
    totalPrayers: requestList.reduce((sum, r) => sum + (r.prayerCount || 0), 0),
  };

  // Get unique categories for filter
  const categories = Array.from(new Set(requestList.map(r => r.category).filter(Boolean))) as string[];

  // Apply filters
  const filteredRequests = requestList.filter(request => {
    if (categoryFilter !== "all" && request.category !== categoryFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        request.requestText.toLowerCase().includes(query) ||
        request.submitterName?.toLowerCase().includes(query) ||
        request.submitterEmail?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/org/${orgId}/prayer-requests/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}/prayer-requests`] });
      toast({
        title: "Prayer request approved",
        description: "The prayer request is now public on your prayer wall.",
      });
      setIsDetailOpen(false);
    },
  });

  const declineMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return apiRequest("PATCH", `/api/org/${orgId}/prayer-requests/${id}/decline`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}/prayer-requests`] });
      toast({
        title: "Prayer request declined",
        description: "The prayer request has been declined.",
      });
      setIsDeclineDialogOpen(false);
      setIsDetailOpen(false);
      setDeclineReason("");
    },
  });

  const answerMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      return apiRequest("PATCH", `/api/org/${orgId}/prayer-requests/${id}/answer`, { answeredNote: note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}/prayer-requests`] });
      toast({
        title: "Marked as answered",
        description: "The prayer request has been marked as answered.",
      });
      setIsAnswerDialogOpen(false);
      setIsDetailOpen(false);
      setAnsweredNote("");
    },
  });

  const pinMutation = useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      return apiRequest("PATCH", `/api/org/${orgId}/prayer-requests/${id}/pin`, { isPinned });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}/prayer-requests`] });
      toast({
        title: "Updated",
        description: "Pin status updated successfully.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/org/${orgId}/prayer-requests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}/prayer-requests`] });
      toast({
        title: "Prayer request deleted",
        description: "The prayer request has been permanently deleted.",
      });
      setDeleteRequestId(null);
    },
  });

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleDecline = () => {
    if (selectedRequest) {
      declineMutation.mutate({ id: selectedRequest.id, reason: declineReason });
    }
  };

  const handleAnswer = () => {
    if (selectedRequest) {
      answerMutation.mutate({ id: selectedRequest.id, note: answeredNote });
    }
  };

  const handlePin = (id: string, currentPinStatus: boolean) => {
    pinMutation.mutate({ id, isPinned: !currentPinStatus });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const openDetail = (request: PrayerRequest) => {
    setSelectedRequest(request);
    setIsDetailOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold truncate">Prayer Wall</h1>
          <p className="text-sm md:text-base text-muted-foreground hidden sm:block">
            Manage prayer requests from your community
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold" data-testid="stat-total">{stats.total}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold" data-testid="stat-pending">{stats.pending}</p>
              </div>
              <Filter className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold" data-testid="stat-approved">{stats.approved}</p>
              </div>
              <Check className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Prayers</p>
                <p className="text-2xl font-bold" data-testid="stat-prayers">{stats.totalPrayers}</p>
              </div>
              <Heart className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prayer requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
            <SelectItem value="answered">Answered</SelectItem>
          </SelectContent>
        </Select>
        <Select value={moderationFilter} onValueChange={setModerationFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-moderation-filter">
            <SelectValue placeholder="Moderation status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Moderation</SelectItem>
            <SelectItem value="approved">AI Approved</SelectItem>
            <SelectItem value="flagged">AI Flagged</SelectItem>
            <SelectItem value="pending">AI Pending</SelectItem>
          </SelectContent>
        </Select>
        {categories.length > 0 && (
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-category-filter">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Prayer Requests List */}
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 md:py-16 px-4">
            <Heart className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg md:text-xl font-semibold mb-2 text-center">
              {requestList.length === 0 ? "No Prayer Requests Yet" : "No requests match your filters"}
            </h3>
            <p className="text-sm md:text-base text-muted-foreground text-center mb-6 max-w-md">
              {requestList.length === 0 
                ? "Prayer requests submitted through your public landing page will appear here for moderation."
                : "Try adjusting your search or filter criteria."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const statusColors = {
              pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
              approved: "bg-green-500/10 text-green-700 dark:text-green-400",
              declined: "bg-red-500/10 text-red-700 dark:text-red-400",
              answered: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
            };

            const moderationColors = {
              approved: "bg-green-500/10 text-green-700 dark:text-green-400",
              flagged: "bg-red-500/10 text-red-700 dark:text-red-400",
              pending: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
            };

            return (
              <Card key={request.id} className="hover-elevate" data-testid={`card-request-${request.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-start gap-2">
                        {request.isPinned && (
                          <Pin className="h-4 w-4 text-primary shrink-0 mt-1" />
                        )}
                        <p className="text-sm md:text-base flex-1" data-testid={`text-request-${request.id}`}>
                          {request.requestText}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={statusColors[request.status as keyof typeof statusColors]} data-testid={`badge-status-${request.id}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                        <Badge className={moderationColors[request.moderationStatus as keyof typeof moderationColors]} variant="outline" data-testid={`badge-moderation-${request.id}`}>
                          AI: {request.moderationStatus.charAt(0).toUpperCase() + request.moderationStatus.slice(1)}
                        </Badge>
                        {request.category && (
                          <Badge variant="secondary" data-testid={`badge-category-${request.id}`}>
                            {request.category.charAt(0).toUpperCase() + request.category.slice(1)}
                          </Badge>
                        )}
                        {request.isAnonymous ? (
                          <Badge variant="outline">Anonymous</Badge>
                        ) : request.submitterName && (
                          <Badge variant="outline">{request.submitterName}</Badge>
                        )}
                        <div className="flex items-center gap-1 text-sm text-muted-foreground ml-auto">
                          <Heart className="h-4 w-4" />
                          <span>{request.prayerCount} prayers</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Submitted: {new Date(request.createdAt).toLocaleDateString()}</span>
                        {request.aiSuggestions?.sentiment && (
                          <span>• Sentiment: {request.aiSuggestions.sentiment}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDetail(request)}
                        data-testid={`button-view-${request.id}`}
                      >
                        View
                      </Button>
                      {request.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            disabled={approveMutation.isPending}
                            data-testid={`button-approve-${request.id}`}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedRequest(request);
                              setIsDeclineDialogOpen(true);
                            }}
                            disabled={declineMutation.isPending}
                            data-testid={`button-decline-${request.id}`}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      {selectedRequest && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Prayer Request Details</DialogTitle>
              <DialogDescription>
                Review and manage this prayer request
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Prayer Request Text */}
              <div>
                <h4 className="font-semibold mb-2">Prayer Request</h4>
                <p className="text-sm p-3 bg-muted rounded-md">{selectedRequest.requestText}</p>
              </div>

              {/* Submitter Info */}
              <div>
                <h4 className="font-semibold mb-2">Submitter</h4>
                <div className="text-sm space-y-1">
                  {selectedRequest.isAnonymous ? (
                    <p className="text-muted-foreground">Anonymous submission</p>
                  ) : (
                    <>
                      {selectedRequest.submitterName && <p>Name: {selectedRequest.submitterName}</p>}
                      {selectedRequest.submitterEmail && <p>Email: {selectedRequest.submitterEmail}</p>}
                    </>
                  )}
                </div>
              </div>

              {/* AI Moderation Insights */}
              <div>
                <h4 className="font-semibold mb-2">AI Moderation Insights</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Content Appropriate:</span>
                    <Badge className={selectedRequest.aiSuggestions?.isAppropriate ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-red-500/10 text-red-700 dark:text-red-400"}>
                      {selectedRequest.aiSuggestions?.isAppropriate ? "Yes" : "No"}
                    </Badge>
                  </div>
                  {selectedRequest.aiSuggestions?.flagReason && (
                    <div>
                      <span className="font-medium">Flag Reason:</span>
                      <p className="text-muted-foreground mt-1">{selectedRequest.aiSuggestions.flagReason}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>Suggested Category:</span>
                    <Badge variant="secondary">
                      {selectedRequest.aiSuggestions?.suggestedCategory || selectedRequest.category || "Other"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sentiment:</span>
                    <Badge variant="outline">
                      {selectedRequest.aiSuggestions?.sentiment || "Neutral"}
                    </Badge>
                  </div>
                  {selectedRequest.aiSuggestions?.moderationNotes && (
                    <div>
                      <span className="font-medium">AI Notes:</span>
                      <p className="text-muted-foreground mt-1">{selectedRequest.aiSuggestions.moderationNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status & Metadata */}
              <div>
                <h4 className="font-semibold mb-2">Status & Metadata</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Status:</span>
                    <Badge>{selectedRequest.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Prayer Count:</span>
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      <span>{selectedRequest.prayerCount}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pinned:</span>
                    <span>{selectedRequest.isPinned ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Public:</span>
                    <span>{selectedRequest.isPublic ? "Yes" : "No"}</span>
                  </div>
                  <div>
                    <span>Created:</span>
                    <p className="text-muted-foreground">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Answered Info */}
              {selectedRequest.isAnswered && (
                <div>
                  <h4 className="font-semibold mb-2">Answered</h4>
                  <div className="space-y-2 text-sm">
                    <p>Date: {selectedRequest.answeredAt ? new Date(selectedRequest.answeredAt).toLocaleString() : "N/A"}</p>
                    {selectedRequest.answeredNote && (
                      <div>
                        <span className="font-medium">Note:</span>
                        <p className="text-muted-foreground mt-1">{selectedRequest.answeredNote}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => handlePin(selectedRequest.id, selectedRequest.isPinned)}
                disabled={pinMutation.isPending}
                data-testid="button-pin"
              >
                <Pin className="h-4 w-4 mr-2" />
                {selectedRequest.isPinned ? "Unpin" : "Pin"}
              </Button>
              
              {selectedRequest.status === "pending" && (
                <>
                  <Button
                    onClick={() => handleApprove(selectedRequest.id)}
                    disabled={approveMutation.isPending}
                    data-testid="button-approve-modal"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setIsDetailOpen(false);
                      setIsDeclineDialogOpen(true);
                    }}
                    disabled={declineMutation.isPending}
                    data-testid="button-decline-modal"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                </>
              )}

              {(selectedRequest.status === "approved" && !selectedRequest.isAnswered) && (
                <Button
                  onClick={() => {
                    setIsDetailOpen(false);
                    setIsAnswerDialogOpen(true);
                  }}
                  data-testid="button-answer"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Mark as Answered
                </Button>
              )}

              <Button
                variant="destructive"
                onClick={() => {
                  setIsDetailOpen(false);
                  setDeleteRequestId(selectedRequest.id);
                }}
                data-testid="button-delete-modal"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Decline Dialog */}
      <Dialog open={isDeclineDialogOpen} onOpenChange={setIsDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Prayer Request</DialogTitle>
            <DialogDescription>
              Provide a reason for declining this prayer request (optional)
            </DialogDescription>
          </DialogHeader>
          <div>
            <Textarea
              placeholder="Reason for declining..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={4}
              data-testid="textarea-decline-reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeclineDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={declineMutation.isPending}
              data-testid="button-confirm-decline"
            >
              Decline Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Answer Dialog */}
      <Dialog open={isAnswerDialogOpen} onOpenChange={setIsAnswerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Answered</DialogTitle>
            <DialogDescription>
              Add a note about how this prayer was answered (optional)
            </DialogDescription>
          </DialogHeader>
          <div>
            <Textarea
              placeholder="How was this prayer answered..."
              value={answeredNote}
              onChange={(e) => setAnsweredNote(e.target.value)}
              rows={4}
              data-testid="textarea-answered-note"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAnswerDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAnswer}
              disabled={answerMutation.isPending}
              data-testid="button-confirm-answer"
            >
              Mark as Answered
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRequestId} onOpenChange={() => setDeleteRequestId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prayer Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this prayer request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRequestId && handleDelete(deleteRequestId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
