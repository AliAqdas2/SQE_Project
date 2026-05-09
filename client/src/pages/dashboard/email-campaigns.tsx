import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Mail, Send, Calendar, Users, Tag } from "lucide-react";
import { format } from "date-fns";
import type { EmailCampaign, EmailTemplate, MemberTag } from "@shared/schema";

export default function EmailCampaignsPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [campaignName, setCampaignName] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [recipientType, setRecipientType] = useState<'all_members' | 'by_tags' | 'custom'>('all_members');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [recipientEmails, setRecipientEmails] = useState("");
  const [sendOption, setSendOption] = useState<'now' | 'schedule'>('now');
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  // Get current session with user and org data
  const { data: session } = useQuery<{ user: any; organization: any }>({
    queryKey: ["/api/auth/session"],
  });

  const user = session?.user;
  const orgId = user?.orgId;

  const { data: campaigns, isLoading: loadingCampaigns } = useQuery<EmailCampaign[]>({
    queryKey: [`/api/org/${orgId}/email-campaigns`],
    enabled: !!orgId,
  });

  const { data: templates } = useQuery<EmailTemplate[]>({
    queryKey: [`/api/org/${orgId}/email-templates`],
    enabled: !!orgId && dialogOpen,
  });

  const { data: tags } = useQuery<MemberTag[]>({
    queryKey: [`/api/org/${orgId}/member-tags`],
    enabled: !!orgId && dialogOpen && recipientType === 'by_tags',
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', `/api/org/${orgId}/email-campaigns`, { ...data, orgId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}/email-campaigns`] });
      toast({
        title: "Campaign created",
        description: "Your email campaign has been created successfully.",
      });
      handleCloseDialog();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      return await apiRequest('POST', `/api/org/${orgId}/email-campaigns/${campaignId}/send`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}/email-campaigns`] });
      toast({
        title: "Campaign queued",
        description: "Your campaign has been queued for sending.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = () => {
    setSelectedTemplate("");
    setCampaignName("");
    setSubject("");
    setPreviewText("");
    setRecipientType('all_members');
    setSelectedTags([]);
    setRecipientEmails("");
    setSendOption('now');
    setScheduledDate("");
    setScheduledTime("");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSubmit = () => {
    if (!selectedTemplate || !campaignName || !subject) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const template = templates?.find(t => t.id === selectedTemplate);
    if (!template) return;

    const scheduledFor = sendOption === 'schedule' && scheduledDate && scheduledTime
      ? new Date(`${scheduledDate}T${scheduledTime}`)
      : null;

    const data = {
      name: campaignName,
      subject,
      previewText,
      templateId: selectedTemplate,
      blocks: template.blocks,
      recipientType,
      recipientTags: recipientType === 'by_tags' ? selectedTags : [],
      recipientEmails: recipientType === 'custom' ? recipientEmails.split(',').map(e => e.trim()) : [],
      status: sendOption === 'now' ? 'draft' : 'scheduled',
      scheduledFor,
      sentCount: 0,
      openedCount: 0,
      clickedCount: 0,
      bouncedCount: 0,
    };

    createCampaignMutation.mutate(data);
  };

  const handleSendNow = (campaignId: string) => {
    if (confirm('Are you sure you want to send this campaign now?')) {
      sendCampaignMutation.mutate(campaignId);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: { variant: "secondary", label: "Draft" },
      scheduled: { variant: "outline", label: "Scheduled" },
      sending: { variant: "default", label: "Sending" },
      sent: { variant: "default", label: "Sent" },
      failed: { variant: "destructive", label: "Failed" },
    };
    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant} data-testid={`badge-status-${status}`}>{config.label}</Badge>;
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-page-title">Email Campaigns</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Create and manage your email marketing campaigns</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenDialog} className="w-full sm:w-auto" data-testid="button-create-campaign">
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Email Campaign</DialogTitle>
              <DialogDescription>
                Select a template and configure your campaign settings
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Select Template *</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger data-testid="select-template">
                    <SelectValue placeholder="Choose a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Campaign Name *</Label>
                <Input
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Monthly Newsletter - January 2025"
                  data-testid="input-campaign-name"
                />
              </div>

              <div>
                <Label>Email Subject *</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Your monthly update from our community"
                  data-testid="input-subject"
                />
              </div>

              <div>
                <Label>Preview Text</Label>
                <Input
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  placeholder="This appears in email previews..."
                  data-testid="input-preview-text"
                />
              </div>

              <div>
                <Label>Recipients *</Label>
                <Select value={recipientType} onValueChange={(value: any) => setRecipientType(value)}>
                  <SelectTrigger data-testid="select-recipient-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_members">All Members</SelectItem>
                    <SelectItem value="by_tags">By Tags</SelectItem>
                    <SelectItem value="custom">Custom Email List</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {recipientType === 'by_tags' && (
                <div>
                  <Label>Select Tags</Label>
                  <div className="space-y-2 mt-2">
                    {tags?.map((tag) => (
                      <label key={tag.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTags([...selectedTags, tag.id]);
                            } else {
                              setSelectedTags(selectedTags.filter(id => id !== tag.id));
                            }
                          }}
                          data-testid={`checkbox-tag-${tag.id}`}
                        />
                        <span>{tag.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {recipientType === 'custom' && (
                <div>
                  <Label>Email Addresses</Label>
                  <Textarea
                    value={recipientEmails}
                    onChange={(e) => setRecipientEmails(e.target.value)}
                    placeholder="email1@example.com, email2@example.com"
                    rows={4}
                    data-testid="textarea-emails"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Separate emails with commas
                  </p>
                </div>
              )}

              <div>
                <Label>Send Option *</Label>
                <Select value={sendOption} onValueChange={(value: any) => setSendOption(value)}>
                  <SelectTrigger data-testid="select-send-option">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="now">Send Now</SelectItem>
                    <SelectItem value="schedule">Schedule for Later</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {sendOption === 'schedule' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      data-testid="input-scheduled-date"
                    />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      data-testid="input-scheduled-time"
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog} data-testid="button-cancel">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createCampaignMutation.isPending}
                data-testid="button-create"
              >
                {createCampaignMutation.isPending ? 'Creating...' : 'Create Campaign'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loadingCampaigns ? (
        <div className="text-center py-12">Loading campaigns...</div>
      ) : campaigns && campaigns.length > 0 ? (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} data-testid={`campaign-card-${campaign.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{campaign.name}</CardTitle>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {campaign.subject}
                      </span>
                      {campaign.scheduledFor && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Scheduled: {format(new Date(campaign.scheduledFor), 'MMM dd, yyyy hh:mm a')}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  {campaign.status === 'draft' && (
                    <Button
                      onClick={() => handleSendNow(campaign.id)}
                      disabled={sendCampaignMutation.isPending}
                      data-testid={`button-send-${campaign.id}`}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Now
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Sent</div>
                    <div className="text-2xl font-bold">{campaign.sentCount}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Opened</div>
                    <div className="text-2xl font-bold">{campaign.openedCount}</div>
                    <div className="text-xs text-muted-foreground">
                      {campaign.sentCount > 0
                        ? `${Math.round((campaign.openedCount / campaign.sentCount) * 100)}%`
                        : '0%'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Clicked</div>
                    <div className="text-2xl font-bold">{campaign.clickedCount}</div>
                    <div className="text-xs text-muted-foreground">
                      {campaign.sentCount > 0
                        ? `${Math.round((campaign.clickedCount / campaign.sentCount) * 100)}%`
                        : '0%'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Bounced</div>
                    <div className="text-2xl font-bold">{campaign.bouncedCount}</div>
                    <div className="text-xs text-muted-foreground">
                      {campaign.sentCount > 0
                        ? `${Math.round((campaign.bouncedCount / campaign.sentCount) * 100)}%`
                        : '0%'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first email campaign to start engaging with your community.
            </p>
            <Button onClick={handleOpenDialog} data-testid="button-create-first-campaign">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Campaign
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
