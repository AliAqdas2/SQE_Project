import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, Mail, Star } from "lucide-react";
import type { EmailTemplate } from "@shared/schema";

interface DonationThankYouSettingsProps {
  orgId: string;
}

const templateFormSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  subject: z.string().min(1, "Subject is required"),
  htmlBody: z.string().min(1, "Email content is required"),
  textBody: z.string().optional(),
  donationType: z.enum(["one-time", "recurring", "both"]),
  minAmount: z.string().optional(),
  maxAmount: z.string().optional(),
  priority: z.coerce.number().int().min(0).max(100).default(0),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

export default function DonationThankYouSettings({ orgId }: DonationThankYouSettingsProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const { data: templates, isLoading } = useQuery<EmailTemplate[]>({
    queryKey: [`/api/org/${orgId}/email-templates`],
    queryFn: async () => {
      const response = await fetch(`/api/org/${orgId}/email-templates?templateType=donation_thank_you`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch templates");
      return response.json();
    },
  });

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      subject: "",
      htmlBody: "",
      textBody: "",
      donationType: "both",
      minAmount: "",
      maxAmount: "",
      priority: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const payload = {
        ...data,
        templateType: "donation_thank_you",
        minAmount: data.minAmount || null,
        maxAmount: data.maxAmount || null,
      };
      return apiRequest("POST", `/api/org/${orgId}/email-templates`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}/email-templates`] });
      toast({
        title: "Template created",
        description: "Your thank you note template has been created successfully.",
      });
      setIsDialogOpen(false);
      form.reset();
      setEditingTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error creating template",
        description: error.message || "Failed to create template",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TemplateFormData }) => {
      const payload = {
        ...data,
        minAmount: data.minAmount || null,
        maxAmount: data.maxAmount || null,
      };
      return apiRequest("PATCH", `/api/org/${orgId}/email-templates/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}/email-templates`] });
      toast({
        title: "Template updated",
        description: "Your thank you note template has been updated successfully.",
      });
      setIsDialogOpen(false);
      form.reset();
      setEditingTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating template",
        description: error.message || "Failed to update template",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/org/${orgId}/email-templates/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}/email-templates`] });
      toast({
        title: "Template deleted",
        description: "The template has been deleted successfully.",
      });
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting template",
        description: error.message || "Failed to delete template",
        variant: "destructive",
      });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/org/${orgId}/email-templates/${id}/set-default`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}/email-templates`] });
      toast({
        title: "Default template set",
        description: "This template is now the default for donations.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error setting default",
        description: error.message || "Failed to set default template",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template);
      form.reset({
        name: template.name,
        subject: template.subject,
        htmlBody: template.htmlBody || "",
        textBody: template.textBody || "",
        donationType: (template.donationType as "one-time" | "recurring" | "both") || "both",
        minAmount: (template.minAmount !== null && template.minAmount !== undefined) ? template.minAmount.toString() : "",
        maxAmount: (template.maxAmount !== null && template.maxAmount !== undefined) ? template.maxAmount.toString() : "",
        priority: template.priority || 0,
      });
    } else {
      setEditingTemplate(null);
      form.reset();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: TemplateFormData) => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    setTemplateToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (templateToDelete) {
      deleteMutation.mutate(templateToDelete);
    }
  };

  const getDonationTypeLabel = (type: string | null) => {
    switch (type) {
      case "one-time":
        return "One-time";
      case "recurring":
        return "Recurring";
      case "both":
        return "Both";
      default:
        return "All";
    }
  };

  const getAmountRangeLabel = (template: EmailTemplate) => {
    const min = (template.minAmount !== null && template.minAmount !== undefined) 
      ? `£${template.minAmount}` 
      : null;
    const max = (template.maxAmount !== null && template.maxAmount !== undefined) 
      ? `£${template.maxAmount}` 
      : null;
    
    if (min && max) return `${min} - ${max}`;
    if (min) return `${min}+`;
    if (max) return `Up to ${max}`;
    return "Any amount";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Donation Thank You Note Templates
              </CardTitle>
              <CardDescription>
                Create personalized thank you emails based on donation type and value
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()} data-testid="button-create-template">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? "Edit Template" : "Create New Template"}
                  </DialogTitle>
                  <DialogDescription>
                    Configure a thank you email template with specific conditions
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., High Value Donor Thank You"
                              {...field}
                              data-testid="input-template-name"
                            />
                          </FormControl>
                          <FormDescription>
                            Internal name for this template
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="donationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Donation Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-donation-type">
                                <SelectValue placeholder="Select donation type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="both">Both (One-time & Recurring)</SelectItem>
                              <SelectItem value="one-time">One-time Only</SelectItem>
                              <SelectItem value="recurring">Recurring Only</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Which donation types should trigger this template
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="minAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Amount (£)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                data-testid="input-min-amount"
                              />
                            </FormControl>
                            <FormDescription>
                              Leave empty for no minimum
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="maxAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Amount (£)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                data-testid="input-max-amount"
                              />
                            </FormControl>
                            <FormDescription>
                              Leave empty for no maximum
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-priority"
                            />
                          </FormControl>
                          <FormDescription>
                            Higher priority templates are checked first (0-100)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Subject</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Thank you for your generous donation!"
                              {...field}
                              data-testid="input-subject"
                            />
                          </FormControl>
                          <FormDescription>
                            Subject line for the email
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="htmlBody"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Content</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Dear {{donorName}},&#10;&#10;Thank you for your {{donationType}} donation of {{amount}}!&#10;&#10;Available variables: {{donorName}}, {{amount}}, {{donationType}}, {{organizationName}}, {{donationCategory}}, {{campaignTitle}}, {{date}}"
                              className="min-h-[200px] font-mono text-sm"
                              {...field}
                              data-testid="input-html-body"
                            />
                          </FormControl>
                          <FormDescription>
                            Use {`{{donorName}}`}, {`{{amount}}`}, {`{{donationType}}`}, {`{{organizationName}}`}, {`{{donationCategory}}`}, {`{{campaignTitle}}`}, {`{{date}}`} as placeholders
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createMutation.isPending || updateMutation.isPending}
                        data-testid="button-save-template"
                      >
                        {createMutation.isPending || updateMutation.isPending
                          ? "Saving..."
                          : editingTemplate
                          ? "Update Template"
                          : "Create Template"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading templates...</p>
            </div>
          ) : templates && templates.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Donation Type</TableHead>
                    <TableHead>Amount Range</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id} data-testid={`row-template-${template.id}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {template.name}
                          {template.isDefault && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getDonationTypeLabel(template.donationType)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getAmountRangeLabel(template)}</TableCell>
                      <TableCell>{template.priority}</TableCell>
                      <TableCell>
                        {template.isActive ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!template.isDefault && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDefaultMutation.mutate(template.id)}
                              data-testid={`button-set-default-${template.id}`}
                            >
                              <Star className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenDialog(template)}
                            data-testid={`button-edit-${template.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(template.id)}
                            disabled={template.isDefault}
                            data-testid={`button-delete-${template.id}`}
                            title={template.isDefault ? "Cannot delete default template" : "Delete template"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <Mail className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-semibold">No templates yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create your first thank you note template to automatically send personalized emails
                </p>
              </div>
              <Button onClick={() => handleOpenDialog()} data-testid="button-create-first-template">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Template
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover-elevate"
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
