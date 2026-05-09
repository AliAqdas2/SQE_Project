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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Handshake, Ticket, Loader2, Edit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";

interface Partner {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  notes: string | null;
  status: string;
  createdBy: string;
  createdAt: string;
}

interface ReferralCode {
  id: string;
  partnerId: string;
  code: string;
  discountPercentage: number;
  commissionPercentage: number;
  isActive: boolean;
  maxUses: number | null;
  usageCount: number;
  expiresAt: string | null;
  createdAt: string;
}

const partnerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive", "pending"]),
});

const referralCodeSchema = z.object({
  partnerId: z.string().min(1, "Partner is required"),
  code: z.string().min(3, "Code must be at least 3 characters").regex(/^[A-Z0-9_-]+$/, "Code must be uppercase alphanumeric"),
  discountPercentage: z.number().min(0).max(100),
  commissionPercentage: z.number().min(0).max(100),
  maxUses: z.number().optional(),
});

type PartnerFormValues = z.infer<typeof partnerSchema>;
type ReferralCodeFormValues = z.infer<typeof referralCodeSchema>;

export default function PartnersPage() {
  const { toast } = useToast();
  const [showPartnerDialog, setShowPartnerDialog] = useState(false);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const partnerForm = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      phone: "",
      notes: "",
      status: "active",
    },
  });

  const codeForm = useForm<ReferralCodeFormValues>({
    resolver: zodResolver(referralCodeSchema),
    defaultValues: {
      partnerId: "",
      code: "",
      discountPercentage: 0,
      commissionPercentage: 0,
    },
  });

  const { data: partners, isLoading: partnersLoading } = useQuery<Partner[]>({
    queryKey: ["/api/eco-admin/partners"],
  });

  const { data: referralCodes, isLoading: codesLoading } = useQuery<ReferralCode[]>({
    queryKey: ["/api/eco-admin/referral-codes"],
  });

  const createPartnerMutation = useMutation({
    mutationFn: async (data: PartnerFormValues) => {
      const response = await apiRequest("POST", "/api/eco-admin/partners", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/eco-admin/partners"] });
      toast({
        title: "Partner created",
        description: "The partner has been created successfully.",
      });
      setShowPartnerDialog(false);
      partnerForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create partner",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const createCodeMutation = useMutation({
    mutationFn: async (data: ReferralCodeFormValues) => {
      const response = await apiRequest("POST", "/api/eco-admin/referral-codes", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/eco-admin/referral-codes"] });
      toast({
        title: "Referral code created",
        description: "The referral code has been created successfully.",
      });
      setShowCodeDialog(false);
      codeForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create code",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleCreatePartner = (data: PartnerFormValues) => {
    createPartnerMutation.mutate(data);
  };

  const handleCreateCode = (data: ReferralCodeFormValues) => {
    createCodeMutation.mutate(data);
  };

  const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
    active: "default",
    inactive: "secondary",
    pending: "destructive",
  };

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-partners">Partners & Referrals</h1>
        <p className="text-muted-foreground">
          Manage partnership relationships and referral codes
        </p>
      </div>

      <Tabs defaultValue="partners" className="space-y-4">
        <TabsList>
          <TabsTrigger value="partners" data-testid="tab-partners">Partners</TabsTrigger>
          <TabsTrigger value="codes" data-testid="tab-codes">Referral Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="partners" className="space-y-4">
          <div className="flex items-center justify-end">
            <Button onClick={() => setShowPartnerDialog(true)} data-testid="button-add-partner">
              <Plus className="h-4 w-4 mr-2" />
              Add Partner
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Partners</CardTitle>
              <CardDescription>All registered partners and their details</CardDescription>
            </CardHeader>
            <CardContent>
              {partnersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : partners && partners.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partners.map((partner) => (
                      <TableRow key={partner.id} data-testid={`row-partner-${partner.id}`}>
                        <TableCell className="font-medium">{partner.name}</TableCell>
                        <TableCell className="text-sm">{partner.email}</TableCell>
                        <TableCell className="text-sm">{partner.company || "—"}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={statusColors[partner.status] || "secondary"}
                            data-testid={`badge-status-${partner.id}`}
                          >
                            {partner.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(partner.createdAt), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No partners yet</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowPartnerDialog(true)}
                    data-testid="button-add-first-partner"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Partner
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="codes" className="space-y-4">
          <div className="flex items-center justify-end">
            <Button onClick={() => setShowCodeDialog(true)} data-testid="button-add-code">
              <Plus className="h-4 w-4 mr-2" />
              Create Code
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Referral Codes</CardTitle>
              <CardDescription>Active and inactive referral codes</CardDescription>
            </CardHeader>
            <CardContent>
              {codesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : referralCodes && referralCodes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referralCodes.map((code) => (
                      <TableRow key={code.id} data-testid={`row-code-${code.id}`}>
                        <TableCell className="font-mono font-semibold">{code.code}</TableCell>
                        <TableCell>{code.discountPercentage}%</TableCell>
                        <TableCell>{code.commissionPercentage}%</TableCell>
                        <TableCell>
                          <span data-testid={`text-usage-${code.id}`}>
                            {code.usageCount} {code.maxUses ? `/ ${code.maxUses}` : ""}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={code.isActive ? "default" : "secondary"}>
                            {code.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No referral codes yet</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowCodeDialog(true)}
                    data-testid="button-add-first-code"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Code
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Partner Dialog */}
      <Dialog open={showPartnerDialog} onOpenChange={setShowPartnerDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Partner</DialogTitle>
            <DialogDescription>
              Create a new partnership relationship
            </DialogDescription>
          </DialogHeader>
          <Form {...partnerForm}>
            <form onSubmit={partnerForm.handleSubmit(handleCreatePartner)} className="space-y-4">
              <FormField
                control={partnerForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Partner name" {...field} data-testid="input-partner-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={partnerForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="partner@example.com" {...field} data-testid="input-partner-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={partnerForm.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Company name" {...field} data-testid="input-partner-company" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={partnerForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-partner-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPartnerDialog(false)}
                  data-testid="button-cancel-partner"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createPartnerMutation.isPending} data-testid="button-submit-partner">
                  {createPartnerMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Create Partner
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Referral Code Dialog */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Referral Code</DialogTitle>
            <DialogDescription>
              Generate a new referral code for a partner
            </DialogDescription>
          </DialogHeader>
          <Form {...codeForm}>
            <form onSubmit={codeForm.handleSubmit(handleCreateCode)} className="space-y-4">
              <FormField
                control={codeForm.control}
                name="partnerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partner</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-code-partner">
                          <SelectValue placeholder="Select partner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {partners?.map((partner) => (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={codeForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="PARTNER2025" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        data-testid="input-code"
                      />
                    </FormControl>
                    <FormDescription>Uppercase alphanumeric only</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={codeForm.control}
                  name="discountPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount %</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          data-testid="input-discount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={codeForm.control}
                  name="commissionPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commission %</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          data-testid="input-commission"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCodeDialog(false)}
                  data-testid="button-cancel-code"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createCodeMutation.isPending} data-testid="button-submit-code">
                  {createCodeMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Create Code
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
