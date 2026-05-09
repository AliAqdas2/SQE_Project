import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Donor } from "@shared/schema";

const donorFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  tier: z.enum(["bronze", "silver", "gold", "platinum"]).default("bronze"),
});

type DonorFormData = z.infer<typeof donorFormSchema>;

export default function DonorFormPage() {
  const [, params] = useRoute("/dashboard/donors/:id/edit");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const donorId = params?.id;
  const isEdit = !!donorId;

  // Get orgId from session
  const { data: session } = useQuery<{ user: { orgId: string } }>({
    queryKey: ["/api/auth/session"],
    enabled: true,
  });

  const orgId = session?.user?.orgId;

  // Fetch donor if editing
  const { data: donor } = useQuery<Donor>({
    queryKey: [`/api/donors/${donorId}`],
    enabled: isEdit && !!donorId,
  });

  const form = useForm<DonorFormData>({
    resolver: zodResolver(donorFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      tier: "bronze",
    },
  });

  // Reset form when donor data loads
  useEffect(() => {
    if (donor && isEdit) {
      form.reset({
        firstName: donor.firstName,
        lastName: donor.lastName,
        email: donor.email,
        phone: donor.phone || "",
        address: donor.address || "",
        tier: (donor.tier as "bronze" | "silver" | "gold" | "platinum") || "bronze",
      });
    }
  }, [donor, isEdit, form]);

  const createMutation = useMutation({
    mutationFn: async (data: DonorFormData) => {
      return apiRequest("POST", "/api/donors", { ...data, orgId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/donors?orgId=${orgId}`] });
      toast({ title: "Donor created successfully" });
      navigate("/dashboard/donors");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create donor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: DonorFormData) => {
      return apiRequest("PATCH", `/api/donors/${donorId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/donors?orgId=${orgId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/donors/${donorId}`] });
      toast({ title: "Donor updated successfully" });
      navigate(`/dashboard/donors/${donorId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update donor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DonorFormData) => {
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
          onClick={() => navigate(isEdit ? `/dashboard/donors/${donorId}` : "/dashboard/donors")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">
          {isEdit ? "Edit Donor" : "Add New Donor"}
        </h1>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} data-testid="input-first-name" />
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
                          <Input placeholder="Doe" {...field} data-testid="input-last-name" />
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
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john.doe@example.com"
                          {...field}
                          data-testid="input-email"
                        />
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
                        <Input
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          {...field}
                          data-testid="input-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="123 Main St, City, State, ZIP"
                          {...field}
                          data-testid="input-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Donor Tier</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-tier">
                            <SelectValue placeholder="Select tier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bronze">Bronze</SelectItem>
                          <SelectItem value="silver">Silver</SelectItem>
                          <SelectItem value="gold">Gold</SelectItem>
                          <SelectItem value="platinum">Platinum</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(isEdit ? `/dashboard/donors/${donorId}` : "/dashboard/donors")}
                  disabled={isPending}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} data-testid="button-submit">
                  {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Donor"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
