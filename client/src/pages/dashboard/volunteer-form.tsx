import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, X, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const volunteerFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  bio: z.string().optional(),
  status: z.enum(["active", "inactive", "on_hold"]).default("active"),
  teams: z.array(z.string()).default([]),
  skills: z.string().optional(),
  interests: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
  backgroundCheckStatus: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
});

type VolunteerFormData = z.infer<typeof volunteerFormSchema>;

interface Volunteer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  bio: string | null;
  status: string;
  teams: string[];
  skills: string[];
  interests: string[];
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  notes: string | null;
  backgroundCheckStatus: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
}

interface SessionResponse {
  user: { orgId: string };
}

export default function VolunteerFormPage() {
  const [, navigate] = useLocation();
  const [matchCreate] = useRoute("/dashboard/volunteers/create");
  const [matchEdit, paramsEdit] = useRoute("/dashboard/volunteers/:id/edit");
  const { toast } = useToast();
  const [createTeamDialogOpen, setCreateTeamDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  
  const isEdit = !!matchEdit;
  const volunteerId = paramsEdit?.id;

  const { data: session } = useQuery<SessionResponse>({
    queryKey: ["/api/auth/session"],
  });

  const orgId = session?.user?.orgId;

  const { data: volunteer } = useQuery<Volunteer>({
    queryKey: [`/api/org/${orgId}/volunteers/${volunteerId}`],
    enabled: !!volunteerId && !!orgId && isEdit,
  });

  // Fetch available teams
  const { data: availableTeams = [], refetch: refetchTeams } = useQuery<string[]>({
    queryKey: [`/api/org/${orgId}/volunteer-teams`],
    enabled: !!orgId,
  });

  // Convert teams to MultiSelectOption format
  // Include currently selected teams even if they're not in the fetched list yet
  const currentSelectedTeams = form.watch("teams") || [];
  const allTeamNames = new Set([...availableTeams, ...currentSelectedTeams]);
  const teamOptions: MultiSelectOption[] = Array.from(allTeamNames)
    .filter(Boolean)
    .map(team => ({
      label: team,
      value: team,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const form = useForm<VolunteerFormData>({
    resolver: zodResolver(volunteerFormSchema),
    defaultValues: volunteer ? {
      firstName: volunteer.firstName,
      lastName: volunteer.lastName,
      email: volunteer.email,
      phone: volunteer.phone || "",
      bio: volunteer.bio || "",
      status: (volunteer.status as "active" | "inactive" | "on_hold"),
      teams: volunteer.teams || [],
      skills: volunteer.skills?.join(", ") || "",
      interests: volunteer.interests?.join(", ") || "",
      street: volunteer.street || "",
      city: volunteer.city || "",
      state: volunteer.state || "",
      zip: volunteer.zip || "",
      country: volunteer.country || "",
      notes: volunteer.notes || "",
      backgroundCheckStatus: volunteer.backgroundCheckStatus || "",
      emergencyContactName: volunteer.emergencyContactName || "",
      emergencyContactPhone: volunteer.emergencyContactPhone || "",
      emergencyContactRelationship: volunteer.emergencyContactRelationship || "",
    } : {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      bio: "",
      status: "active",
      teams: [],
      skills: "",
      interests: "",
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      notes: "",
      backgroundCheckStatus: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelationship: "",
    },
  });

  // Reset form when volunteer data loads
  useEffect(() => {
    if (volunteer && isEdit) {
      form.reset({
        firstName: volunteer.firstName,
        lastName: volunteer.lastName,
        email: volunteer.email,
        phone: volunteer.phone || "",
        bio: volunteer.bio || "",
        status: (volunteer.status as "active" | "inactive" | "on_hold"),
        teams: volunteer.teams || [],
        skills: volunteer.skills?.join(", ") || "",
        interests: volunteer.interests?.join(", ") || "",
        street: volunteer.street || "",
        city: volunteer.city || "",
        state: volunteer.state || "",
        zip: volunteer.zip || "",
        country: volunteer.country || "",
        notes: volunteer.notes || "",
        backgroundCheckStatus: volunteer.backgroundCheckStatus || "",
        emergencyContactName: volunteer.emergencyContactName || "",
        emergencyContactPhone: volunteer.emergencyContactPhone || "",
        emergencyContactRelationship: volunteer.emergencyContactRelationship || "",
      });
    }
  }, [volunteer, isEdit, form]);

  const createMutation = useMutation({
    mutationFn: async (data: VolunteerFormData) => {
      const payload = {
        ...data,
        teams: data.teams || [],
        skills: data.skills ? data.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
        interests: data.interests ? data.interests.split(",").map(s => s.trim()).filter(Boolean) : [],
      };
      return apiRequest("POST", `/api/org/${orgId}/volunteers`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}/volunteers`] });
      toast({ title: "Volunteer created successfully" });
      navigate("/dashboard/volunteers");
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create volunteer", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: VolunteerFormData) => {
      const payload = {
        ...data,
        teams: data.teams || [],
        skills: data.skills ? data.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
        interests: data.interests ? data.interests.split(",").map(s => s.trim()).filter(Boolean) : [],
      };
      return apiRequest("PATCH", `/api/org/${orgId}/volunteers/${volunteerId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}/volunteers`] });
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}/volunteers/${volunteerId}`] });
      toast({ title: "Volunteer updated successfully" });
      navigate(`/dashboard/volunteers/${volunteerId}`);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update volunteer", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Team creation mutation
  const createTeamMutation = useMutation({
    mutationFn: async (teamName: string) => {
      const response = await apiRequest("POST", `/api/org/${orgId}/volunteer-teams`, { name: teamName });
      return await response.json();
    },
    onSuccess: (data) => {
      // Invalidate teams query to refresh the list
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}/volunteer-teams`] });
      
      // Add the new team to the form's selected teams
      const currentTeams = form.getValues("teams") || [];
      if (!currentTeams.includes(data.name)) {
        form.setValue("teams", [...currentTeams, data.name]);
      }
      
      // Close dialog and reset input
      setCreateTeamDialogOpen(false);
      setNewTeamName("");
      
      toast({ 
        title: "Team created successfully",
        description: `"${data.name}" has been added to available teams and selected.`
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create team", 
        description: error.message || "Please try again.",
        variant: "destructive" 
      });
    },
  });

  const handleCreateTeam = () => {
    const trimmed = newTeamName.trim();
    if (!trimmed) {
      toast({
        title: "Team name required",
        description: "Please enter a team name.",
        variant: "destructive"
      });
      return;
    }
    createTeamMutation.mutate(trimmed);
  };

  const onSubmit = (data: VolunteerFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(isEdit ? `/dashboard/volunteers/${volunteerId}` : "/dashboard/volunteers")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">
          {isEdit ? "Edit Volunteer" : "Add New Volunteer"}
        </h1>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="John" data-testid="input-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Doe" data-testid="input-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="john@example.com" data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+1 (555) 123-4567" data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Tell us about this volunteer..." 
                          className="min-h-20"
                          data-testid="textarea-bio"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Status & Teams */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Status & Teams</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="teams"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teams</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <MultiSelect
                                  options={teamOptions}
                                  selected={field.value || []}
                                  onChange={field.onChange}
                                  placeholder="Select teams..."
                                  emptyMessage="No teams available. Create a new team to get started."
                                  data-testid="multi-select-teams"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setCreateTeamDialogOpen(true)}
                                data-testid="button-create-team"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Select teams from the list or create a new one
                            </p>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Skills & Interests */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Skills & Interests</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="skills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skills (comma separated)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Teaching, Music, Carpentry" data-testid="input-skills" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="interests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interests (comma separated)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Youth Work, Outreach" data-testid="input-interests" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Address</h3>
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="123 Main St" data-testid="input-street" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Springfield" data-testid="input-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State/Province</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="IL" data-testid="input-state" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="zip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP/Postal Code</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="62701" data-testid="input-zip" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="USA" data-testid="input-country" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="emergencyContactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Jane Doe" data-testid="input-emergency-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emergencyContactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+1 (555) 123-4567" data-testid="input-emergency-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emergencyContactRelationship"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Relationship</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Spouse, Parent, Sibling..." data-testid="input-emergency-relationship" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="backgroundCheckStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Background Check Status</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Completed, Pending" data-testid="input-background-check" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Any additional notes about this volunteer..." 
                            className="min-h-24"
                            data-testid="textarea-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(isEdit ? `/dashboard/volunteers/${volunteerId}` : "/dashboard/volunteers")}
                  disabled={isPending}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} data-testid="button-submit">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEdit ? "Update Volunteer" : "Create Volunteer"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Create Team Dialog */}
      <Dialog open={createTeamDialogOpen} onOpenChange={setCreateTeamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a new team that can be assigned to volunteers. The team will be available for all volunteers in your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="team-name" className="text-sm font-medium">
                Team Name
              </label>
              <Input
                id="team-name"
                placeholder="e.g., Youth Ministry, Hospitality"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateTeam();
                  }
                }}
                data-testid="input-new-team-name"
              />
              {availableTeams.some(team => team.toLowerCase() === newTeamName.trim().toLowerCase()) && (
                <p className="text-sm text-destructive">
                  A team with this name already exists.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCreateTeamDialogOpen(false);
                setNewTeamName("");
              }}
              disabled={createTeamMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateTeam}
              disabled={createTeamMutation.isPending || !newTeamName.trim()}
              data-testid="button-create-team-submit"
            >
              {createTeamMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
