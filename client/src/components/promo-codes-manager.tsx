import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Percent, Tag } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { EventPromoCode } from "@shared/schema";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";

const promoCodeSchema = z.object({
  code: z.string().min(1, "Code is required").toUpperCase(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.string().min(0),
  maxUses: z.coerce.number().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  isActive: z.boolean().default(true),
});

type PromoCodeFormValues = z.infer<typeof promoCodeSchema>;

interface PromoCodesManagerProps {
  eventId: string;
}

export function PromoCodesManager({ eventId }: PromoCodesManagerProps) {
  const [open, setOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<EventPromoCode | null>(null);
  const { toast } = useToast();
  const { formatCurrency } = useOrganizationLocale();

  const { data: promoCodes = [], isLoading } = useQuery<EventPromoCode[]>({
    queryKey: [`/api/events/${eventId}/promo-codes`],
    enabled: !!eventId,
  });

  const form = useForm<PromoCodeFormValues>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues: {
      code: "",
      discountType: "percentage",
      discountValue: "10",
      maxUses: undefined,
      validFrom: "",
      validUntil: "",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PromoCodeFormValues) => {
      return await apiRequest("POST", `/api/events/${eventId}/promo-codes`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Promo code created successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/promo-codes`] });
      setOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create promo code", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PromoCodeFormValues }) => {
      return await apiRequest("PATCH", `/api/events/${eventId}/promo-codes/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Promo code updated successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/promo-codes`] });
      setOpen(false);
      setEditingPromo(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update promo code", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/events/${eventId}/promo-codes/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Promo code deleted successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/promo-codes`] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete promo code", variant: "destructive" });
    },
  });

  const onSubmit = (data: PromoCodeFormValues) => {
    if (editingPromo) {
      updateMutation.mutate({ id: editingPromo.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (promo: EventPromoCode) => {
    setEditingPromo(promo);
    form.reset({
      code: promo.code,
      discountType: promo.discountType as "percentage" | "fixed",
      discountValue: promo.discountValue,
      maxUses: promo.maxUses || undefined,
      validFrom: promo.validFrom ? new Date(promo.validFrom).toISOString().slice(0, 16) : "",
      validUntil: promo.validUntil ? new Date(promo.validUntil).toISOString().slice(0, 16) : "",
      isActive: promo.isActive,
    });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this promo code?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddNew = () => {
    setEditingPromo(null);
    form.reset();
    setOpen(true);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading promo codes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Promo Codes</h2>
          <p className="text-muted-foreground">Create discount codes to promote your event</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} data-testid="button-create-promo-code">
              <Plus className="h-4 w-4 mr-2" />
              Add Promo Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPromo ? "Edit Promo Code" : "Create Promo Code"}</DialogTitle>
              <DialogDescription>
                {editingPromo ? "Update the promo code details" : "Create a discount code for your event"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Promo Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., EARLYBIRD, SAVE20" {...field} data-testid="input-promo-code" className="uppercase" />
                      </FormControl>
                      <FormDescription>Code will be automatically converted to uppercase</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="discountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-discount-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discountValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Value</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="10"
                            {...field}
                            data-testid="input-discount-value"
                          />
                        </FormControl>
                        <FormDescription>
                          {form.watch("discountType") === "percentage" ? "Enter percentage (0-100)" : "Enter amount"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="maxUses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Uses (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Leave empty for unlimited"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          data-testid="input-max-uses"
                        />
                      </FormControl>
                      <FormDescription>Leave empty for unlimited uses</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="validFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valid From (Optional)</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} data-testid="input-valid-from" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="validUntil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valid Until (Optional)</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} data-testid="input-valid-until" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>Enable this promo code for use</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-promo-active" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save">
                    {editingPromo ? "Update" : "Create"} Promo Code
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {promoCodes.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No promo codes yet</h3>
              <p className="text-muted-foreground mb-4">Create discount codes to boost ticket sales</p>
              <Button onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                Add Promo Code
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Promo Codes</CardTitle>
            <CardDescription>Manage discount codes for your event</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Uses</TableHead>
                    <TableHead>Valid Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promoCodes.map((promo) => (
                    <TableRow key={promo.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          <span className="font-mono font-bold">{promo.code}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {promo.discountType === "percentage" ? (
                          <div className="flex items-center">
                            <Percent className="h-4 w-4 mr-1" />
                            {promo.discountValue}%
                          </div>
                        ) : (
                          <div>{formatCurrency(parseFloat(promo.discountValue))}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {promo.usedCount} {promo.maxUses ? `/ ${promo.maxUses}` : ""}
                      </TableCell>
                      <TableCell>
                        {promo.validFrom && promo.validUntil ? (
                          <div className="text-xs">
                            <div>{new Date(promo.validFrom).toLocaleDateString()}</div>
                            <div className="text-muted-foreground">to {new Date(promo.validUntil).toLocaleDateString()}</div>
                          </div>
                        ) : promo.validUntil ? (
                          <div className="text-xs">Until {new Date(promo.validUntil).toLocaleDateString()}</div>
                        ) : (
                          <span className="text-muted-foreground">No expiry</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={promo.isActive ? "default" : "secondary"}>
                          {promo.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(promo)} data-testid={`button-edit-${promo.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(promo.id)}
                            data-testid={`button-delete-${promo.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
