import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Coins, Ticket } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { EventTicketType } from "@shared/schema";

const ticketTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.string().min(0),
  quantity: z.coerce.number().min(1, "Must have at least 1 ticket"),
  minPerOrder: z.coerce.number().min(1).default(1),
  maxPerOrder: z.coerce.number().min(1).default(10),
  salesStart: z.string().optional(),
  salesEnd: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().default(0),
});

type TicketTypeFormValues = z.infer<typeof ticketTypeSchema>;

interface TicketTypesManagerProps {
  eventId: string;
}

export function TicketTypesManager({ eventId }: TicketTypesManagerProps) {
  const [open, setOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<EventTicketType | null>(null);
  const { toast } = useToast();

  const { data: ticketTypes = [], isLoading } = useQuery<EventTicketType[]>({
    queryKey: [`/api/events/${eventId}/ticket-types`],
    enabled: !!eventId,
  });

  const form = useForm<TicketTypeFormValues>({
    resolver: zodResolver(ticketTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "0",
      quantity: 100,
      minPerOrder: 1,
      maxPerOrder: 10,
      salesStart: "",
      salesEnd: "",
      isActive: true,
      sortOrder: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TicketTypeFormValues) => {
      return await apiRequest("POST", `/api/events/${eventId}/ticket-types`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Ticket type created successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/ticket-types`] });
      setOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create ticket type", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TicketTypeFormValues }) => {
      return await apiRequest("PATCH", `/api/events/${eventId}/ticket-types/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Ticket type updated successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/ticket-types`] });
      setOpen(false);
      setEditingTicket(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update ticket type", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/events/${eventId}/ticket-types/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Ticket type deleted successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/ticket-types`] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete ticket type", variant: "destructive" });
    },
  });

  const onSubmit = (data: TicketTypeFormValues) => {
    if (editingTicket) {
      updateMutation.mutate({ id: editingTicket.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (ticket: EventTicketType) => {
    setEditingTicket(ticket);
    form.reset({
      name: ticket.name,
      description: ticket.description || "",
      price: ticket.price,
      quantity: ticket.quantity,
      minPerOrder: ticket.minPerOrder,
      maxPerOrder: ticket.maxPerOrder,
      salesStart: ticket.salesStart ? new Date(ticket.salesStart).toISOString().slice(0, 16) : "",
      salesEnd: ticket.salesEnd ? new Date(ticket.salesEnd).toISOString().slice(0, 16) : "",
      isActive: ticket.isActive,
      sortOrder: ticket.sortOrder,
    });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this ticket type?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddNew = () => {
    setEditingTicket(null);
    form.reset();
    setOpen(true);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading ticket types...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ticket Types</h2>
          <p className="text-muted-foreground">Manage ticket tiers and pricing for your event</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} data-testid="button-create-ticket-type">
              <Plus className="h-4 w-4 mr-2" />
              Add Ticket Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTicket ? "Edit Ticket Type" : "Create Ticket Type"}</DialogTitle>
              <DialogDescription>
                {editingTicket ? "Update the ticket type details" : "Add a new ticket tier for your event"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ticket Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., General Admission, VIP, Early Bird" {...field} data-testid="input-ticket-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="What's included with this ticket?" {...field} data-testid="textarea-ticket-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} data-testid="input-ticket-price" />
                        </FormControl>
                        <FormDescription>Set to 0 for free tickets</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-ticket-quantity"
                          />
                        </FormControl>
                        <FormDescription>Total available</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minPerOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Per Order</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-min-per-order"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxPerOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Per Order</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-max-per-order"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="salesStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sales Start (Optional)</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} data-testid="input-sales-start" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="salesEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sales End (Optional)</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} data-testid="input-sales-end" />
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
                        <FormDescription>Make this ticket type available for purchase</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-is-active" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save">
                    {editingTicket ? "Update" : "Create"} Ticket Type
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {ticketTypes.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Ticket className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No ticket types yet</h3>
              <p className="text-muted-foreground mb-4">Get started by creating your first ticket type</p>
              <Button onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                Add Ticket Type
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Ticket Types</CardTitle>
            <CardDescription>Manage pricing tiers for your event</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Sold</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ticketTypes.map((ticket) => {
                    const soldPercentage = (ticket.sold / ticket.quantity) * 100;
                    return (
                      <TableRow key={ticket.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{ticket.name}</div>
                            {ticket.description && <div className="text-sm text-muted-foreground">{ticket.description}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Coins className="h-4 w-4 mr-1" />
                            {parseFloat(ticket.price).toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>{ticket.quantity}</TableCell>
                        <TableCell>
                          <div>
                            <div>{ticket.sold}</div>
                            <div className="text-xs text-muted-foreground">{soldPercentage.toFixed(0)}% sold</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={ticket.isActive ? "default" : "secondary"}>
                            {ticket.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" onClick={() => handleEdit(ticket)} data-testid={`button-edit-${ticket.id}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(ticket.id)}
                              data-testid={`button-delete-${ticket.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
