import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertContactSchema, type Contact } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = insertContactSchema.omit({ orgId: true, createdAt: true, updatedAt: true }).extend({
  types: z.array(z.string()).default([]),
});

type FormData = z.infer<typeof formSchema>;

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

const LEAD_SOURCES = [
  { value: "website", label: "Website" },
  { value: "event", label: "Event" },
  { value: "referral", label: "Referral" },
  { value: "social_media", label: "Social Media" },
  { value: "email_campaign", label: "Email Campaign" },
  { value: "phone", label: "Phone" },
  { value: "direct_mail", label: "Direct Mail" },
  { value: "other", label: "Other" },
];

const CONTACT_METHODS = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "sms", label: "SMS" },
  { value: "mail", label: "Mail" },
];

export default function ContactFormPage() {
  const [, params] = useRoute("/dashboard/contacts/:id/edit");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEdit = !!params?.id;

  const { data: contact, isLoading } = useQuery<Contact>({
    queryKey: [`/api/contacts/${params?.id}`],
    enabled: isEdit,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: contact?.firstName || "",
      lastName: contact?.lastName || "",
      email: contact?.email || "",
      phone: contact?.phone || "",
      company: contact?.company || "",
      jobTitle: contact?.jobTitle || "",
      street: contact?.street || "",
      city: contact?.city || "",
      state: contact?.state || "",
      zip: contact?.zip || "",
      country: contact?.country || "",
      types: contact?.types || [],
      notes: contact?.notes || "",
      leadSource: contact?.leadSource || "",
      leadStatus: contact?.leadStatus || "",
      preferredContactMethod: contact?.preferredContactMethod || "",
      emailOptIn: contact?.emailOptIn ?? true,
      smsOptIn: contact?.smsOptIn ?? false,
      status: contact?.status || "active",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEdit) {
        return await apiRequest("PUT", `/api/contacts/${params.id}`, data);
      } else {
        return await apiRequest("POST", "/api/contacts", data);
      }
    },
    onSuccess: (data: any) => {
      toast({
        title: `Contact ${isEdit ? "updated" : "created"} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: [`/api/contacts/${params.id}`] });
      }
      navigate(`/dashboard/contacts/${data.id}`);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: `Failed to ${isEdit ? "update" : "create"} contact`,
      });
    },
  });

  if (isEdit && isLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (isEdit && contact) {
    form.reset({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone || "",
      company: contact.company || "",
      jobTitle: contact.jobTitle || "",
      street: contact.street || "",
      city: contact.city || "",
      state: contact.state || "",
      zip: contact.zip || "",
      country: contact.country || "",
      types: contact.types,
      notes: contact.notes || "",
      leadSource: contact.leadSource || "",
      leadStatus: contact.leadStatus || "",
      preferredContactMethod: contact.preferredContactMethod || "",
      emailOptIn: contact.emailOptIn,
      smsOptIn: contact.smsOptIn,
      status: contact.status,
    });
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Link href={isEdit ? `/dashboard/contacts/${params.id}` : "/dashboard/contacts"}>
            <Button variant="ghost" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isEdit ? "Edit Contact" : "Add New Contact"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-first-name" />
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
                          <Input {...field} data-testid="input-last-name" />
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
                          <Input type="email" {...field} data-testid="input-email" />
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
                          <Input {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-company" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="jobTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-job-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Address</h3>
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-street" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-city" />
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
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-state" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="zip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-zip" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-country" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contact Types</h3>
                  <FormField
                    control={form.control}
                    name="types"
                    render={() => (
                      <FormItem>
                        <div className="grid gap-3 md:grid-cols-2">
                          {CONTACT_TYPES.map((type) => (
                            <FormField
                              key={type.value}
                              control={form.control}
                              name="types"
                              render={({ field }) => (
                                <FormItem className="flex items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(type.value)}
                                      onCheckedChange={(checked) => {
                                        const newValue = checked
                                          ? [...(field.value || []), type.value]
                                          : field.value?.filter((v) => v !== type.value) || [];
                                        field.onChange(newValue);
                                      }}
                                      data-testid={`checkbox-type-${type.value}`}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {type.label}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Additional Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="leadSource"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lead Source</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger data-testid="select-lead-source">
                                <SelectValue placeholder="Select lead source" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {LEAD_SOURCES.map((source) => (
                                <SelectItem key={source.value} value={source.value}>
                                  {source.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="preferredContactMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Contact Method</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger data-testid="select-preferred-contact">
                                <SelectValue placeholder="Select contact method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CONTACT_METHODS.map((method) => (
                                <SelectItem key={method.value} value={method.value}>
                                  {method.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-6">
                    <FormField
                      control={form.control}
                      name="emailOptIn"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-email-opt-in"
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Email Opt-in
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="smsOptIn"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-sms-opt-in"
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            SMS Opt-in
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={4}
                            placeholder="Add any additional notes about this contact"
                            data-testid="textarea-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={mutation.isPending}
                    data-testid="button-save"
                  >
                    {mutation.isPending ? "Saving..." : isEdit ? "Update Contact" : "Create Contact"}
                  </Button>
                  <Link href={isEdit ? `/dashboard/contacts/${params.id}` : "/dashboard/contacts"}>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
