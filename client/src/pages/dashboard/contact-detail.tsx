import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { ArrowLeft, Edit, Trash2, Mail, Phone, MapPin, Building2, Calendar, Coins, Tag as TagIcon, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";
import type { Contact, ContactTag, ContactActivity } from "@shared/schema";
import { format } from "date-fns";

const CONTACT_TYPES = [
  { value: "donor", label: "Donor" },
  { value: "volunteer", label: "Volunteer" },
  { value: "lead", label: "Lead" },
  { value: "sponsor", label: "Sponsor" },
  { value: "speaker", label: "Speaker" },
  { value: "partner", label: "Partner" },
  { value: "board_member", label: "Board Member" },
  { value: "staff", label: "Staff" },
  { value: "vendor", label: "Vendor" },
  { value: "beneficiary", label: "Beneficiary" },
];

const ACTIVITY_TYPES = [
  { value: "email", label: "Email" },
  { value: "call", label: "Call" },
  { value: "meeting", label: "Meeting" },
  { value: "donation", label: "Donation" },
  { value: "event_attendance", label: "Event Attendance" },
  { value: "note", label: "Note" },
];

export default function ContactDetailPage() {
  const [, params] = useRoute("/dashboard/contacts/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { formatCurrency } = useOrganizationLocale();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addActivityDialogOpen, setAddActivityDialogOpen] = useState(false);
  const [addTagDialogOpen, setAddTagDialogOpen] = useState(false);
  const [activityType, setActivityType] = useState("note");
  const [activitySubject, setActivitySubject] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string>("");

  const contactId = params?.id;

  const { data: contact, isLoading: loadingContact } = useQuery<Contact>({
    queryKey: [`/api/contacts/${contactId}`],
    enabled: !!contactId,
  });

  const { data: contactTags, isLoading: loadingTags } = useQuery<ContactTag[]>({
    queryKey: [`/api/contacts/${contactId}/tags`],
    enabled: !!contactId,
  });

  const { data: activities, isLoading: loadingActivities } = useQuery<ContactActivity[]>({
    queryKey: [`/api/contacts/${contactId}/activities`],
    enabled: !!contactId,
  });

  const { data: allTags } = useQuery<ContactTag[]>({
    queryKey: ["/api/contact-tags"],
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/contacts/${contactId}`);
    },
    onSuccess: () => {
      toast({ title: "Contact deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      navigate("/dashboard/contacts");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Failed to delete contact",
      });
    },
  });

  const addActivityMutation = useMutation({
    mutationFn: async (data: { type: string; subject?: string; description?: string }) => {
      return await apiRequest("POST", `/api/contacts/${contactId}/activities`, data);
    },
    onSuccess: () => {
      toast({ title: "Activity added successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}/activities`] });
      setAddActivityDialogOpen(false);
      setActivitySubject("");
      setActivityDescription("");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Failed to add activity",
      });
    },
  });

  const addTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      return await apiRequest("POST", `/api/contacts/${contactId}/tags`, { tagId });
    },
    onSuccess: () => {
      toast({ title: "Tag added successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}/tags`] });
      setAddTagDialogOpen(false);
      setSelectedTagId("");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Failed to add tag",
      });
    },
  });

  const removeTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      return await apiRequest("DELETE", `/api/contacts/${contactId}/tags/${tagId}`);
    },
    onSuccess: () => {
      toast({ title: "Tag removed successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}/tags`] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Failed to remove tag",
      });
    },
  });

  const availableTags = allTags?.filter(
    (tag) => !contactTags?.some((ct) => ct.id === tag.id)
  ) || [];

  if (loadingContact) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="font-semibold text-lg mb-2">Contact not found</h3>
              <Link href="/dashboard/contacts">
                <Button variant="outline">Back to Contacts</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/dashboard/contacts">
            <Button variant="ghost" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contacts
            </Button>
          </Link>
          <div className="flex gap-2">
            <Link href={`/dashboard/contacts/${contactId}/edit`}>
              <Button variant="outline" data-testid="button-edit">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              data-testid="button-delete"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl" data-testid="text-contact-name">
                  {contact.firstName} {contact.lastName}
                </CardTitle>
                {contact.company && (
                  <p className="text-muted-foreground flex items-center gap-2 mt-2">
                    <Building2 className="h-4 w-4" />
                    {contact.company}
                    {contact.jobTitle && ` • ${contact.jobTitle}`}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                {contact.types.map((type) => (
                  <Badge key={type} variant="secondary">
                    {CONTACT_TYPES.find(t => t.value === type)?.label || type}
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {contact.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{contact.email}</p>
                  </div>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{contact.phone}</p>
                  </div>
                </div>
              )}
              {(contact.street || contact.city) && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">
                      {contact.street && <>{contact.street}<br /></>}
                      {contact.city}, {contact.state} {contact.zip}
                    </p>
                  </div>
                </div>
              )}
              {contact.totalDonated > 0 && (
                <div className="flex items-center gap-3">
                  <Coins className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Donated</p>
                    <p className="font-medium text-lg">
                      {formatCurrency(parseFloat(contact.totalDonated.toString()))}
                    </p>
                  </div>
                </div>
              )}
              {contact.donationCount > 0 && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Donations</p>
                    <p className="font-medium">{contact.donationCount} gifts</p>
                  </div>
                </div>
              )}
            </div>

            {contact.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Notes</p>
                  <p className="whitespace-pre-wrap">{contact.notes}</p>
                </div>
              </>
            )}

            <Separator />
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Tags</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAddTagDialogOpen(true)}
                  data-testid="button-add-tag"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Tag
                </Button>
              </div>
              {loadingTags ? (
                <Skeleton className="h-8 w-full" />
              ) : contactTags && contactTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {contactTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="gap-1"
                      style={{ backgroundColor: tag.color + "20", color: tag.color, borderColor: tag.color }}
                    >
                      <TagIcon className="h-3 w-3" />
                      {tag.name}
                      <button
                        onClick={() => removeTagMutation.mutate(tag.id)}
                        className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                        data-testid={`button-remove-tag-${tag.id}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tags added</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="activity">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="activity">Activity History</TabsTrigger>
            <TabsTrigger value="details">Additional Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Activity Timeline</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => setAddActivityDialogOpen(true)}
                    data-testid="button-add-activity"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Activity
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingActivities ? (
                  <Skeleton className="h-32 w-full" />
                ) : activities && activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex gap-3 border-l-2 border-border pl-4 py-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {ACTIVITY_TYPES.find(t => t.value === activity.type)?.label || activity.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(activity.createdAt), "MMM d, yyyy 'at' h:mm a")}
                            </span>
                          </div>
                          {activity.subject && (
                            <p className="font-medium">{activity.subject}</p>
                          )}
                          {activity.description && (
                            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                              {activity.description}
                            </p>
                          )}
                          {activity.outcome && (
                            <p className="text-sm mt-1">
                              <span className="text-muted-foreground">Outcome:</span> {activity.outcome}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No activity recorded yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {contact.donorTier && (
                    <div>
                      <p className="text-sm text-muted-foreground">Donor Tier</p>
                      <p className="font-medium">
                        {contact.donorTier.charAt(0).toUpperCase() + contact.donorTier.slice(1)}
                      </p>
                    </div>
                  )}
                  {contact.leadStatus && (
                    <div>
                      <p className="text-sm text-muted-foreground">Lead Status</p>
                      <p className="font-medium">{contact.leadStatus}</p>
                    </div>
                  )}
                  {contact.leadSource && (
                    <div>
                      <p className="text-sm text-muted-foreground">Lead Source</p>
                      <p className="font-medium">{contact.leadSource}</p>
                    </div>
                  )}
                  {contact.preferredContactMethod && (
                    <div>
                      <p className="text-sm text-muted-foreground">Preferred Contact Method</p>
                      <p className="font-medium">{contact.preferredContactMethod}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Email Opt-in</p>
                    <p className="font-medium">{contact.emailOptIn ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">SMS Opt-in</p>
                    <p className="font-medium">{contact.smsOptIn ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={contact.status === "active" ? "default" : "secondary"}>
                      {contact.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Contact</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this contact? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                data-testid="button-confirm-delete"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={addActivityDialogOpen} onOpenChange={setAddActivityDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Activity</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Type</Label>
                <Select value={activityType} onValueChange={setActivityType}>
                  <SelectTrigger data-testid="select-activity-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subject</Label>
                <Input
                  value={activitySubject}
                  onChange={(e) => setActivitySubject(e.target.value)}
                  placeholder="Brief summary"
                  data-testid="input-activity-subject"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={activityDescription}
                  onChange={(e) => setActivityDescription(e.target.value)}
                  placeholder="Detailed notes"
                  rows={4}
                  data-testid="textarea-activity-description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAddActivityDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  addActivityMutation.mutate({
                    type: activityType,
                    subject: activitySubject || undefined,
                    description: activityDescription || undefined,
                  })
                }
                disabled={addActivityMutation.isPending}
                data-testid="button-save-activity"
              >
                {addActivityMutation.isPending ? "Adding..." : "Add Activity"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={addTagDialogOpen} onOpenChange={setAddTagDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Tag</DialogTitle>
            </DialogHeader>
            <div>
              <Label>Select Tag</Label>
              <Select value={selectedTagId} onValueChange={setSelectedTagId}>
                <SelectTrigger data-testid="select-tag">
                  <SelectValue placeholder="Choose a tag" />
                </SelectTrigger>
                <SelectContent>
                  {availableTags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddTagDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => selectedTagId && addTagMutation.mutate(selectedTagId)}
                disabled={!selectedTagId || addTagMutation.isPending}
                data-testid="button-save-tag"
              >
                {addTagMutation.isPending ? "Adding..." : "Add Tag"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
