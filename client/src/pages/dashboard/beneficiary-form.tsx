import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const beneficiaryFormSchema = z.object({
  type: z.enum(["individual", "organization"]),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  organizationName: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  biography: z.string().optional(),
  status: z.enum(["active", "completed", "on_hold", "inactive"]).default("active"),
  urgencyLevel: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  healthStatus: z.enum(["good", "fair", "poor", "critical"]).optional(),
  medicalConditions: z.string().optional(),
  primaryNeeds: z.string().optional(),
  tags: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
}).refine(data => {
  if (data.type === "individual") {
    return data.firstName && data.lastName;
  }
  return data.organizationName;
}, {
  message: "Individual beneficiaries require first and last name, organizations require organization name",
  path: ["type"],
});

type BeneficiaryFormData = z.infer<typeof beneficiaryFormSchema>;

interface Beneficiary {
  id: string;
  type: string;
  firstName: string | null;
  lastName: string | null;
  organizationName: string | null;
  email: string | null;
  phone: string | null;
  biography: string | null;
  status: string;
  urgencyLevel: string;
  healthStatus: string | null;
  medicalConditions: string[] | null;
  primaryNeeds: string[] | null;
  tags: string[] | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
}

interface SessionResponse {
  user: { orgId: string };
}

export default function BeneficiaryFormPage() {
  const [, navigate] = useLocation();
  const [matchCreate] = useRoute("/dashboard/beneficiaries/create");
  const [matchEdit, paramsEdit] = useRoute("/dashboard/beneficiaries/:id/edit");
  const { toast } = useToast();
  
  const isEdit = !!matchEdit;
  const beneficiaryId = paramsEdit?.id;

  const { data: session } = useQuery<SessionResponse>({
    queryKey: ["/api/auth/session"],
  });

  const orgId = session?.user?.orgId;

  const { data: beneficiary } = useQuery<Beneficiary>({
    queryKey: [`/api/org/${orgId}/beneficiaries/${beneficiaryId}`],
    enabled: !!beneficiaryId && !!orgId && isEdit,
  });

  const form = useForm<BeneficiaryFormData>({
    resolver: zodResolver(beneficiaryFormSchema),
    defaultValues: beneficiary ? {
      type: beneficiary.type as "individual" | "organization",
      firstName: beneficiary.firstName || "",
      lastName: beneficiary.lastName || "",
      organizationName: beneficiary.organizationName || "",
      email: beneficiary.email || "",
      phone: beneficiary.phone || "",
      biography: beneficiary.biography || "",
      status: beneficiary.status as "active" | "completed" | "on_hold" | "inactive",
      urgencyLevel: beneficiary.urgencyLevel as "low" | "medium" | "high" | "critical",
      healthStatus: beneficiary.healthStatus as "good" | "fair" | "poor" | "critical" | undefined,
      medicalConditions: Array.isArray(beneficiary.medicalConditions) ? beneficiary.medicalConditions.join(", ") : "",
      primaryNeeds: Array.isArray(beneficiary.primaryNeeds) ? beneficiary.primaryNeeds.join(", ") : "",
      tags: Array.isArray(beneficiary.tags) ? beneficiary.tags.join(", ") : "",
      street: beneficiary.street || "",
      city: beneficiary.city || "",
      state: beneficiary.state || "",
      zip: beneficiary.zip || "",
      country: beneficiary.country || "",
    } : {
      type: "individual",
      firstName: "",
      lastName: "",
      organizationName: "",
      email: "",
      phone: "",
      biography: "",
      status: "active",
      urgencyLevel: "medium",
      healthStatus: undefined,
      medicalConditions: "",
      primaryNeeds: "",
      tags: "",
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    },
  });

  useEffect(() => {
    if (beneficiary && isEdit) {
      form.reset({
        type: beneficiary.type as "individual" | "organization",
        firstName: beneficiary.firstName || "",
        lastName: beneficiary.lastName || "",
        organizationName: beneficiary.organizationName || "",
        email: beneficiary.email || "",
        phone: beneficiary.phone || "",
        biography: beneficiary.biography || "",
        status: beneficiary.status as "active" | "completed" | "on_hold" | "inactive",
        urgencyLevel: beneficiary.urgencyLevel as "low" | "medium" | "high" | "critical",
        healthStatus: beneficiary.healthStatus as "good" | "fair" | "poor" | "critical" | undefined,
        medicalConditions: Array.isArray(beneficiary.medicalConditions) ? beneficiary.medicalConditions.join(", ") : "",
        primaryNeeds: Array.isArray(beneficiary.primaryNeeds) ? beneficiary.primaryNeeds.join(", ") : "",
        tags: Array.isArray(beneficiary.tags) ? beneficiary.tags.join(", ") : "",
        street: beneficiary.street || "",
        city: beneficiary.city || "",
        state: beneficiary.state || "",
        zip: beneficiary.zip || "",
        country: beneficiary.country || "",
      });
    }
  }, [beneficiary, isEdit, form]);

  const createMutation = useMutation({
    mutationFn: async (data: BeneficiaryFormData) => {
      const payload = {
        ...data,
        primaryNeeds: data.primaryNeeds ? data.primaryNeeds.split(",").map(s => s.trim()).filter(Boolean) : [],
        medicalConditions: data.medicalConditions ? data.medicalConditions.split(",").map(s => s.trim()).filter(Boolean) : [],
        tags: data.tags ? data.tags.split(",").map(s => s.trim()).filter(Boolean) : [],
      };
      return apiRequest("POST", `/api/org/${orgId}/beneficiaries`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}/beneficiaries`] });
      toast({ title: "Beneficiary created successfully" });
      navigate("/dashboard/beneficiaries");
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create beneficiary", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: BeneficiaryFormData) => {
      const payload = {
        ...data,
        primaryNeeds: data.primaryNeeds ? data.primaryNeeds.split(",").map(s => s.trim()).filter(Boolean) : [],
        medicalConditions: data.medicalConditions ? data.medicalConditions.split(",").map(s => s.trim()).filter(Boolean) : [],
        tags: data.tags ? data.tags.split(",").map(s => s.trim()).filter(Boolean) : [],
      };
      return apiRequest("PATCH", `/api/org/${orgId}/beneficiaries/${beneficiaryId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}/beneficiaries`] });
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}/beneficiaries/${beneficiaryId}`] });
      toast({ title: "Beneficiary updated successfully" });
      navigate(`/dashboard/beneficiaries/${beneficiaryId}`);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update beneficiary", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: BeneficiaryFormData) => {
    if (!orgId) {
      toast({ 
        title: "Error", 
        description: "Organization ID not available",
        variant: "destructive" 
      });
      return;
    }
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const beneficiaryType = form.watch("type");

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/dashboard/beneficiaries")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">
          {isEdit ? "Edit Beneficiary" : "Add New Beneficiary"}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="organization">Organization</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {beneficiaryType === "individual" ? (
                <div className="grid gap-4 sm:grid-cols-2">
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
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="organizationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-organization-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
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
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="urgencyLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urgency Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-urgency">
                            <SelectValue placeholder="Select urgency level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="biography"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biography</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} data-testid="input-biography" />
                    </FormControl>
                    <FormDescription>Brief description and background of the beneficiary</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {beneficiaryType === "individual" && (
                <>
                  <FormField
                    control={form.control}
                    name="healthStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Health Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-health-status">
                              <SelectValue placeholder="Select health status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="fair">Fair</SelectItem>
                            <SelectItem value="poor">Poor</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="medicalConditions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medical Conditions</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="diabetes, hypertension, etc." data-testid="input-medical-conditions" />
                        </FormControl>
                        <FormDescription>Comma-separated list of medical conditions</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="primaryNeeds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Needs</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="food, housing, medical, education" data-testid="input-primary-needs" />
                    </FormControl>
                    <FormDescription>Comma-separated list of current needs</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="elderly, family, refugee" data-testid="input-tags" />
                    </FormControl>
                    <FormDescription>Comma-separated tags for categorization</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-street" />
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
                      <FormLabel>State/Province</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-state" />
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
                        <Input {...field} data-testid="input-zip" />
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
                        <Input {...field} data-testid="input-country" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/beneficiaries")}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!orgId || createMutation.isPending || updateMutation.isPending}
              data-testid="button-submit"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEdit ? "Update Beneficiary" : "Create Beneficiary"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
