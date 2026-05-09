import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, apiRequestTyped } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  ArrowLeft,
  Plus,
  Users,
  Mail,
  Trophy,
  MessageSquare,
  FileText,
  Settings,
  Trash2,
  Crown,
  ArrowRight
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { P2PCampaignSettings, P2PInvitation, P2PParticipantWithStats } from "@shared/schema";

interface SubscriptionInfo {
  subscription: { id: string; planId: string; status: string };
  plan: { id: string; tierCode: string; name: string };
}

export default function P2PManagePage() {
  const { campaignId } = useParams();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [participantDialogOpen, setParticipantDialogOpen] = useState(false);

  // Get current user session
  const { data: session } = useQuery<{ user: { orgId: string } }>({
    queryKey: ["/api/auth/session"],
  });

  // Check subscription status
  const { data: subscriptionInfo, isLoading: subscriptionLoading } = useQuery<SubscriptionInfo>({
    queryKey: ["/api/org", session?.user?.orgId, "subscription"],
    enabled: !!session?.user?.orgId,
  });

  const isFreePlan = subscriptionInfo?.plan?.tierCode?.toLowerCase() === "free";

  // Fetch campaign details
  const { data: campaign } = useQuery({
    queryKey: [`/api/campaigns/${campaignId}`],
  });

  // Show upgrade prompt for free plan users
  if (!subscriptionLoading && isFreePlan) {
    return (
      <div className="p-4 md:p-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Upgrade for P2P Fundraising</h2>
              <p className="text-muted-foreground max-w-md">
                Peer-to-peer fundraising is a premium feature. Upgrade your plan to 
                enable supporters to create their own fundraising pages.
              </p>
            </div>
            <Button size="lg" onClick={() => setLocation("/dashboard/subscription")} data-testid="button-upgrade-p2p">
              View Plans & Upgrade
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch P2P settings
  const { data: settings, isLoading: settingsLoading } = useQuery<P2PCampaignSettings>({
    queryKey: [`/api/p2p/campaigns/${campaignId}/settings`],
  });

  // Fetch participants with stats
  const { data: participants = [], isLoading: participantsLoading } = useQuery<P2PParticipantWithStats[]>({
    queryKey: [`/api/p2p/campaigns/${campaignId}/participants`, { stats: true }],
    enabled: settings?.isEnabled || false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Fetch invitations
  const { data: invitations = [] } = useQuery<P2PInvitation[]>({
    queryKey: [`/api/p2p/campaigns/${campaignId}/invitations`],
    enabled: settings?.isEnabled || false,
  });

  // Toggle P2P enabled
  const toggleP2PMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return apiRequest('POST', `/api/p2p/campaigns/${campaignId}/settings`, {
        isEnabled: enabled,
        requireApproval: settings?.requireApproval ?? false,
        defaultParticipantGoal: settings?.defaultParticipantGoal,
        welcomeMessage: settings?.welcomeMessage,
        participantInstructions: settings?.participantInstructions,
      });
    },
    onSuccess: async (data) => {
      await queryClient.refetchQueries({ queryKey: [`/api/p2p/campaigns/${campaignId}/settings`] });
      toast({
        title: "P2P Settings Updated",
        description: "Peer-to-peer fundraising has been " + (data?.isEnabled ? "enabled" : "disabled"),
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update P2P settings",
        variant: "destructive",
      });
    },
  });

  // Create participant
  const createParticipantMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; goal: string; story?: string }) => {
      return apiRequestTyped<P2PParticipantWithStats>('POST', `/api/p2p/campaigns/${campaignId}/participants`, data);
    },
    onSuccess: (newParticipant) => {
      const queryKey = [`/api/p2p/campaigns/${campaignId}/participants`, { stats: true }];
      
      queryClient.setQueryData<P2PParticipantWithStats[]>(queryKey, (oldData) => {
        if (!oldData) return [newParticipant];
        return [...oldData, newParticipant].sort((a, b) => 
          parseFloat(b.raisedAmount) - parseFloat(a.raisedAmount)
        );
      });
      
      setParticipantDialogOpen(false);
      toast({
        title: "Participant Added",
        description: "Fundraiser has been successfully added",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add participant",
        variant: "destructive",
      });
    },
  });

  // Send invitation
  const sendInvitationMutation = useMutation({
    mutationFn: async (data: { email: string; name?: string; message?: string }) => {
      return apiRequest('POST', `/api/p2p/campaigns/${campaignId}/invitations`, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [`/api/p2p/campaigns/${campaignId}/invitations`] });
      setInviteDialogOpen(false);
      toast({
        title: "Invitation Sent",
        description: "Fundraiser invitation has been sent successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  // Delete participant
  const deleteParticipantMutation = useMutation({
    mutationFn: async (participantId: string) => {
      return apiRequestTyped<void>('DELETE', `/api/p2p/participants/${participantId}`);
    },
    onSuccess: (_, participantId) => {
      const queryKey = [`/api/p2p/campaigns/${campaignId}/participants`, { stats: true }];
      
      queryClient.setQueryData<P2PParticipantWithStats[]>(queryKey, (oldData) => {
        if (!oldData) return [];
        return oldData.filter(p => p.id !== participantId);
      });
      
      toast({
        title: "Participant Removed",
        description: "Fundraiser has been removed from this campaign",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove participant",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: string, currency: string = 'GBP') => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
    }).format(parseFloat(amount));
  };

  if (settingsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="p2p-manage-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/campaigns/${campaignId}/manage`}>
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Peer-to-Peer Fundraising</h1>
            <p className="text-muted-foreground" data-testid="text-campaign-name">
              {campaign?.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="p2p-enabled" data-testid="label-p2p-toggle">Enable P2P</Label>
          <Switch
            id="p2p-enabled"
            checked={settings?.isEnabled || false}
            onCheckedChange={(checked) => toggleP2PMutation.mutate(checked)}
            disabled={toggleP2PMutation.isPending}
            data-testid="switch-p2p-enabled"
          />
        </div>
      </div>

      {!settings?.isEnabled ? (
        <Card data-testid="card-p2p-disabled">
          <CardHeader>
            <CardTitle>Peer-to-Peer Fundraising Disabled</CardTitle>
            <CardDescription>
              Enable peer-to-peer fundraising to allow supporters to create their own fundraising pages and invite others to join your campaign.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <h3 className="font-semibold">What is Peer-to-Peer Fundraising?</h3>
                <p className="text-sm text-muted-foreground">
                  Peer-to-peer fundraising empowers your supporters to become fundraisers. They can create personal fundraising pages, set their own goals, and share with their networks, multiplying your campaign's reach.
                </p>
              </div>
              <div className="grid gap-2">
                <h3 className="font-semibold">Features Include:</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Personal fundraising pages for each participant</li>
                  <li>Leaderboards and rankings to encourage friendly competition</li>
                  <li>Milestone tracking and achievement badges</li>
                  <li>Participant chat room for collaboration</li>
                  <li>Document library for sharing resources</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="participants" className="w-full">
          <TabsList>
            <TabsTrigger value="participants" data-testid="tab-participants">
              <Users className="h-4 w-4 mr-2" />
              Participants ({participants.length})
            </TabsTrigger>
            <TabsTrigger value="invitations" data-testid="tab-invitations">
              <Mail className="h-4 w-4 mr-2" />
              Invitations ({invitations.length})
            </TabsTrigger>
            <TabsTrigger value="leaderboard" data-testid="tab-leaderboard">
              <Trophy className="h-4 w-4 mr-2" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Participants Tab */}
          <TabsContent value="participants" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Manage your peer-to-peer fundraisers
              </p>
              <Dialog open={participantDialogOpen} onOpenChange={setParticipantDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-participant">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Participant
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Fundraiser</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      createParticipantMutation.mutate({
                        name: formData.get('name') as string,
                        email: formData.get('email') as string,
                        goal: formData.get('goal') as string,
                        story: formData.get('story') as string || undefined,
                      });
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        required
                        placeholder="John Doe"
                        data-testid="input-participant-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="john@example.com"
                        data-testid="input-participant-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="goal">Fundraising Goal *</Label>
                      <Input
                        id="goal"
                        name="goal"
                        type="number"
                        required
                        placeholder="1000"
                        data-testid="input-participant-goal"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="story">Personal Story (optional)</Label>
                      <Textarea
                        id="story"
                        name="story"
                        placeholder="Why I'm fundraising..."
                        rows={3}
                        data-testid="textarea-participant-story"
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={createParticipantMutation.isPending}
                        data-testid="button-submit-participant"
                      >
                        {createParticipantMutation.isPending ? "Adding..." : "Add Participant"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {participantsLoading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </CardContent>
              </Card>
            ) : participants.length === 0 ? (
              <Card data-testid="card-no-participants">
                <CardContent className="p-6 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No participants yet. Add your first fundraiser to get started!</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Goal</TableHead>
                      <TableHead>Raised</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Donations</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map((participant) => (
                      <TableRow key={participant.id} data-testid={`row-participant-${participant.id}`}>
                        <TableCell className="font-medium">{participant.firstName} {participant.lastName}</TableCell>
                        <TableCell>{participant.email}</TableCell>
                        <TableCell>{formatCurrency(participant.goalAmount, campaign?.country)}</TableCell>
                        <TableCell>{formatCurrency(participant.raisedAmount, campaign?.country)}</TableCell>
                        <TableCell>
                          <Badge variant={participant.percentOfGoal >= 100 ? "default" : "secondary"}>
                            {participant.percentOfGoal.toFixed(0)}%
                          </Badge>
                        </TableCell>
                        <TableCell>{participant.donationCount}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a
                                href={`${window.location.origin}/p2p/${participant.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                data-testid={`link-view-page-${participant.id}`}
                              >
                                View Page
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (window.confirm('Are you sure you want to remove this participant?')) {
                                  deleteParticipantMutation.mutate(participant.id);
                                }
                              }}
                              data-testid={`button-delete-participant-${participant.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Invite supporters to become fundraisers
              </p>
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-send-invitation">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Fundraiser</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      sendInvitationMutation.mutate({
                        email: formData.get('email') as string,
                        name: formData.get('name') as string || undefined,
                        message: formData.get('message') as string || undefined,
                      });
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="invite-email">Email Address *</Label>
                      <Input
                        id="invite-email"
                        name="email"
                        type="email"
                        required
                        placeholder="supporter@example.com"
                        data-testid="input-invite-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invite-name">Name (optional)</Label>
                      <Input
                        id="invite-name"
                        name="name"
                        placeholder="John Doe"
                        data-testid="input-invite-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invite-message">Personal Message (optional)</Label>
                      <Textarea
                        id="invite-message"
                        name="message"
                        placeholder="I'd love for you to join our fundraising team..."
                        rows={3}
                        data-testid="textarea-invite-message"
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={sendInvitationMutation.isPending}
                        data-testid="button-submit-invitation"
                      >
                        {sendInvitationMutation.isPending ? "Sending..." : "Send Invitation"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Sent Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No invitations sent yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    invitations.map((invitation) => (
                      <TableRow key={invitation.id} data-testid={`row-invitation-${invitation.id}`}>
                        <TableCell>{invitation.email}</TableCell>
                        <TableCell>{invitation.name || '-'}</TableCell>
                        <TableCell>{new Date(invitation.sentAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {invitation.acceptedAt ? (
                            <Badge variant="default">Accepted</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fundraiser Leaderboard</CardTitle>
                <CardDescription>
                  Top performers ranked by funds raised
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Raised</TableHead>
                      <TableHead>Goal</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Donations</TableHead>
                      <TableHead>Badges</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants
                      .sort((a, b) => b.rank - a.rank)
                      .map((participant) => (
                        <TableRow key={participant.id} data-testid={`row-leaderboard-${participant.id}`}>
                          <TableCell>
                            <div className="flex items-center justify-center">
                              {participant.rank === 1 && <Trophy className="h-5 w-5 text-yellow-500" />}
                              {participant.rank === 2 && <Trophy className="h-5 w-5 text-gray-400" />}
                              {participant.rank === 3 && <Trophy className="h-5 w-5 text-orange-600" />}
                              {participant.rank > 3 && <span className="text-muted-foreground">#{participant.rank}</span>}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{participant.firstName} {participant.lastName}</TableCell>
                          <TableCell>{formatCurrency(participant.raisedAmount, campaign?.country)}</TableCell>
                          <TableCell>{formatCurrency(participant.goalAmount, campaign?.country)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all"
                                  style={{ width: `${Math.min(participant.percentOfGoal, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm">{participant.percentOfGoal.toFixed(0)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{participant.donationCount}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{participant.badgesUnlocked} badges</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>P2P Settings</CardTitle>
                <CardDescription>
                  Configure peer-to-peer fundraising options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Self-Signup</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow anyone to sign up as a fundraiser without invitation
                    </p>
                  </div>
                  <Switch
                    checked={settings?.allowSelfSignup || false}
                    disabled
                    data-testid="switch-allow-self-signup"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Fundraising Goal</Label>
                    <p className="text-sm text-muted-foreground">
                      Participants must set a fundraising goal
                    </p>
                  </div>
                  <Switch
                    checked={settings?.participantGoalRequired || false}
                    disabled
                    data-testid="switch-goal-required"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Welcome Message</Label>
                  <Textarea
                    placeholder="Welcome new fundraisers with a custom message..."
                    rows={4}
                    value={settings?.welcomeMessage || ''}
                    disabled
                    data-testid="textarea-welcome-message"
                  />
                  <p className="text-sm text-muted-foreground">
                    This message will be shown to new participants
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
