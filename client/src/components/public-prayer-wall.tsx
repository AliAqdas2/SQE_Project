import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Pin, Send, CheckCircle2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PrayerRequest {
  id: string;
  submitterName: string | null;
  isAnonymous: boolean;
  requestText: string;
  category: string | null;
  isPinned: boolean;
  prayerCount: number;
  isAnswered: boolean;
  answeredNote: string | null;
  createdAt: string;
}

interface PublicPrayerWallProps {
  orgId: string;
  orgSlug: string;
}

export default function PublicPrayerWall({ orgId, orgSlug }: PublicPrayerWallProps) {
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [requestText, setRequestText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const { data: requests, isLoading } = useQuery<PrayerRequest[]>({
    queryKey: [`/api/prayer-requests?orgId=${orgId}`],
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/prayer-requests", {
        orgId,
        submitterName: isAnonymous ? null : submitterName,
        submitterEmail: isAnonymous ? null : submitterEmail,
        requestText,
        isAnonymous,
        isPublic: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/prayer-requests?orgId=${orgId}`] });
      toast({
        title: "Prayer request submitted",
        description: "Your prayer request is pending approval and will appear on the wall soon.",
      });
      setSubmitterName("");
      setSubmitterEmail("");
      setRequestText("");
      setIsAnonymous(false);
      setShowForm(false);
    },
    onError: () => {
      toast({
        title: "Submission failed",
        description: "There was an error submitting your prayer request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const prayMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/prayer-requests/${id}/pray`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/prayer-requests?orgId=${orgId}`] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestText.trim()) {
      toast({
        title: "Prayer request required",
        description: "Please enter your prayer request.",
        variant: "destructive",
      });
      return;
    }
    if (!isAnonymous && !submitterName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name or check 'Submit anonymously'.",
        variant: "destructive",
      });
      return;
    }
    submitMutation.mutate();
  };

  const handlePray = (id: string) => {
    prayMutation.mutate(id);
    toast({
      title: "Thank you for praying",
      description: "Your prayer has been counted.",
    });
  };

  const categoryColors = {
    health: "bg-red-500/10 text-red-700 dark:text-red-400",
    family: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    financial: "bg-green-500/10 text-green-700 dark:text-green-400",
    spiritual: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    guidance: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    thanksgiving: "bg-pink-500/10 text-pink-700 dark:text-pink-400",
    other: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  };

  const prayerList = requests || [];
  const pinnedRequests = prayerList.filter(r => r.isPinned);
  const regularRequests = prayerList.filter(r => !r.isPinned);

  if (isLoading) {
    return (
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="text-center mb-8 md:mb-12">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-16 bg-muted/30" id="prayer-wall">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Prayer Wall</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Submit your prayer request and join our community in prayer
          </p>
          {!showForm && (
            <Button
              size="lg"
              onClick={() => setShowForm(true)}
              data-testid="button-submit-prayer"
            >
              <Send className="h-5 w-5 mr-2" />
              Submit a Prayer Request
            </Button>
          )}
        </div>

        {/* Submission Form */}
        {showForm && (
          <Card className="mb-8 md:mb-12 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Submit Your Prayer Request</CardTitle>
              <CardDescription>
                Share your prayer request with our community. All requests are reviewed before being posted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isAnonymous && (
                  <>
                    <div>
                      <Label htmlFor="name">Your Name *</Label>
                      <Input
                        id="name"
                        value={submitterName}
                        onChange={(e) => setSubmitterName(e.target.value)}
                        placeholder="Enter your name"
                        required={!isAnonymous}
                        data-testid="input-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email (optional)</Label>
                      <Input
                        id="email"
                        type="email"
                        value={submitterEmail}
                        onChange={(e) => setSubmitterEmail(e.target.value)}
                        placeholder="your@email.com"
                        data-testid="input-email"
                      />
                    </div>
                  </>
                )}
                <div>
                  <Label htmlFor="request">Prayer Request *</Label>
                  <Textarea
                    id="request"
                    value={requestText}
                    onChange={(e) => setRequestText(e.target.value)}
                    placeholder="Share what you would like us to pray for..."
                    rows={5}
                    required
                    data-testid="textarea-request"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="anonymous"
                    checked={isAnonymous}
                    onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                    data-testid="checkbox-anonymous"
                  />
                  <Label htmlFor="anonymous" className="cursor-pointer">
                    Submit anonymously
                  </Label>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitMutation.isPending}
                    data-testid="button-submit"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Prayer Request
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Prayer Requests Grid */}
        {prayerList.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12 md:py-16 px-4">
              <Heart className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg md:text-xl font-semibold mb-2 text-center">
                Be the first to share
              </h3>
              <p className="text-sm md:text-base text-muted-foreground text-center mb-6 max-w-md">
                No prayer requests yet. Share your prayer request and be part of our community.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Pinned Requests */}
            {pinnedRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Pin className="h-5 w-5 text-primary" />
                  Featured Prayer Requests
                </h3>
                <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
                  {pinnedRequests.map((request) => (
                    <Card key={request.id} className="hover-elevate" data-testid={`card-prayer-${request.id}`}>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-sm md:text-base mb-3" data-testid={`text-prayer-${request.id}`}>
                                {request.requestText}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                {request.category && (
                                  <Badge
                                    className={categoryColors[request.category as keyof typeof categoryColors]}
                                    data-testid={`badge-category-${request.id}`}
                                  >
                                    {request.category.charAt(0).toUpperCase() + request.category.slice(1)}
                                  </Badge>
                                )}
                                {request.isAnswered && (
                                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Answered
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {request.isAnonymous ? "Anonymous" : request.submitterName}
                                </span>
                              </div>
                            </div>
                            <Pin className="h-4 w-4 text-primary shrink-0" />
                          </div>

                          {request.isAnswered && request.answeredNote && (
                            <div className="p-3 bg-green-500/10 rounded-md">
                              <p className="text-sm text-green-700 dark:text-green-400">
                                <strong>Praise Report:</strong> {request.answeredNote}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-3 border-t">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Heart className="h-4 w-4" />
                              <span data-testid={`text-prayer-count-${request.id}`}>{request.prayerCount} prayers</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePray(request.id)}
                              disabled={prayMutation.isPending}
                              data-testid={`button-pray-${request.id}`}
                            >
                              <Heart className="h-4 w-4 mr-2" />
                              I Prayed
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Regular Requests */}
            {regularRequests.length > 0 && (
              <div>
                {pinnedRequests.length > 0 && (
                  <h3 className="text-lg font-semibold mb-4">All Prayer Requests</h3>
                )}
                <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
                  {regularRequests.map((request) => (
                    <Card key={request.id} className="hover-elevate" data-testid={`card-prayer-${request.id}`}>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm md:text-base mb-3" data-testid={`text-prayer-${request.id}`}>
                              {request.requestText}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              {request.category && (
                                <Badge
                                  className={categoryColors[request.category as keyof typeof categoryColors]}
                                  data-testid={`badge-category-${request.id}`}
                                >
                                  {request.category.charAt(0).toUpperCase() + request.category.slice(1)}
                                </Badge>
                              )}
                              {request.isAnswered && (
                                <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Answered
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {request.isAnonymous ? "Anonymous" : request.submitterName}
                              </span>
                            </div>
                          </div>

                          {request.isAnswered && request.answeredNote && (
                            <div className="p-3 bg-green-500/10 rounded-md">
                              <p className="text-sm text-green-700 dark:text-green-400">
                                <strong>Praise Report:</strong> {request.answeredNote}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-3 border-t">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Heart className="h-4 w-4" />
                              <span data-testid={`text-prayer-count-${request.id}`}>{request.prayerCount} prayers</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePray(request.id)}
                              disabled={prayMutation.isPending}
                              data-testid={`button-pray-${request.id}`}
                            >
                              <Heart className="h-4 w-4 mr-2" />
                              I Prayed
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
