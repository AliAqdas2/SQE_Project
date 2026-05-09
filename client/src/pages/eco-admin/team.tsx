import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, UserCog, Loader2, Mail, MoreVertical, Edit, UserX } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}

const teamMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
});

type TeamMemberFormValues = z.infer<typeof teamMemberSchema>;

export default function TeamMembersPage() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const form = useForm<TeamMemberFormValues>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
    },
  });

  const editForm = useForm<TeamMemberFormValues>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
    },
  });

  const { data: teamMembers, isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/eco-admin/team"],
  });

  const addMemberMutation = useMutation({
    mutationFn: async (data: TeamMemberFormValues) => {
      const response = await apiRequest("POST", "/api/eco-admin/team", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/eco-admin/team"] });
      toast({
        title: "Team member added",
        description: "The new team member has been added successfully.",
      });
      setShowAddDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add team member",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleAddMember = (data: TeamMemberFormValues) => {
    addMemberMutation.mutate(data);
  };

  const editMemberMutation = useMutation({
    mutationFn: async (data: TeamMemberFormValues & { id: string }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest("PATCH", `/api/eco-admin/team/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/eco-admin/team"] });
      toast({
        title: "Team member updated",
        description: "The team member has been updated successfully.",
      });
      setShowEditDialog(false);
      setSelectedMember(null);
      editForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update team member",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const disableMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/eco-admin/team/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/eco-admin/team"] });
      toast({
        title: "Team member disabled",
        description: "The team member has been disabled successfully.",
      });
      setShowDisableDialog(false);
      setSelectedMember(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to disable team member",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleEditMember = (data: TeamMemberFormValues) => {
    if (selectedMember) {
      editMemberMutation.mutate({ ...data, id: selectedMember.id });
    }
  };

  const handleDisableMember = () => {
    if (selectedMember) {
      disableMemberMutation.mutate(selectedMember.id);
    }
  };

  const openEditDialog = (member: TeamMember) => {
    setSelectedMember(member);
    editForm.reset({
      email: member.email,
      firstName: member.firstName,
      lastName: member.lastName,
    });
    setShowEditDialog(true);
  };

  const openDisableDialog = (member: TeamMember) => {
    setSelectedMember(member);
    setShowDisableDialog(true);
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="heading-team">Team Members</h1>
          <p className="text-muted-foreground">
            Manage eco admin team members and their access
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-member">
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            All eco admin team members with access to the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : teamMembers && teamMembers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id} data-testid={`row-member-${member.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCog className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{member.firstName} {member.lastName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{member.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" data-testid={`badge-role-${member.id}`}>
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(member.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-actions-${member.id}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEditDialog(member)}
                            data-testid={`button-edit-${member.id}`}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDisableDialog(member)}
                            className="text-destructive"
                            data-testid={`button-disable-${member.id}`}
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Disable
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <UserCog className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No team members yet</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowAddDialog(true)}
                data-testid="button-add-first-member"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Member
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a new eco admin team member. They will receive an invitation email.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddMember)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} data-testid="input-firstName" />
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
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} data-testid="input-lastName" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="john@example.com" 
                        {...field} 
                        data-testid="input-email" 
                      />
                    </FormControl>
                    <FormDescription>
                      The team member will receive login credentials via email
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addMemberMutation.isPending}
                  data-testid="button-submit"
                >
                  {addMemberMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Add Member
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update team member information
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditMember)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} data-testid="input-edit-firstName" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} data-testid="input-edit-lastName" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="john@example.com" 
                        {...field} 
                        data-testid="input-edit-email" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setSelectedMember(null);
                  }}
                  data-testid="button-edit-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={editMemberMutation.isPending}
                  data-testid="button-edit-submit"
                >
                  {editMemberMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disable <strong>{selectedMember?.firstName} {selectedMember?.lastName}</strong>? 
              This will remove their access to the Eco Admin portal. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDisableDialog(false);
                setSelectedMember(null);
              }}
              data-testid="button-disable-cancel"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisableMember}
              className="bg-destructive hover:bg-destructive/90"
              disabled={disableMemberMutation.isPending}
              data-testid="button-disable-confirm"
            >
              {disableMemberMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Disable Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
