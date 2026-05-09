import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRoute, useLocation } from "wouter";
import { insertActivitySchema } from "@shared/schema";
import { ImageUpload } from "@/components/image-upload";

const formSchema = insertActivitySchema.extend({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
}).omit({ orgId: true });

type FormValues = z.infer<typeof formSchema>;

interface Activity {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  teacher: string | null;
  imageUrl: string | null;
  isPaid: boolean;
  price: string;
  currency: string | null;
  maxStudents: number | null;
  currentStudents: number;
  scheduleType: string;
  startDate: Date | null;
  endDate: Date | null;
  startTime: string | null;
  endTime: string | null;
  isPublished: boolean;
}

export default function EditActivityPage() {
  const [_, params] = useRoute("/dashboard/activities/:id/edit");
  const [__, setLocation] = useLocation();
  const activityId = params?.id;
  const { toast } = useToast();

  const { data: activity, isLoading } = useQuery<Activity>({
    queryKey: ["/api/activities", activityId],
    enabled: !!activityId,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: activity ? {
      title: activity.title,
      description: activity.description || "",
      category: activity.category || "",
      teacher: activity.teacher || "",
      imageUrl: activity.imageUrl || "",
      isPaid: activity.isPaid,
      price: activity.price,
      currency: activity.currency || "USD",
      scheduleType: activity.scheduleType,
      maxStudents: activity.maxStudents,
      currentStudents: activity.currentStudents,
      startDate: activity.startDate ? new Date(activity.startDate).toISOString().split('T')[0] : "",
      endDate: activity.endDate ? new Date(activity.endDate).toISOString().split('T')[0] : "",
      startTime: activity.startTime || "",
      endTime: activity.endTime || "",
      isPublished: activity.isPublished,
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const activityData = {
        ...data,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
      };
      return await apiRequest("PATCH", `/api/activities/${activityId}`, activityData);
    },
    onSuccess: () => {
      toast({
        title: "Activity Updated",
        description: "Your activity has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities", activityId] });
      setLocation(`/dashboard/activities/${activityId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update activity. Please try again.",
        variant: "destructive",
      });
    },
  });

  const isPaid = form.watch("isPaid");

  const onSubmit = (data: FormValues) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="p-4 md:p-8">
        <p className="text-muted-foreground">Activity not found</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Edit Activity</h1>
        <p className="text-sm md:text-base text-muted-foreground">Update activity details</p>
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
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Arabic Language Class" data-testid="input-title" />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="Describe what students will learn..."
                        rows={4}
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="Language, Art, Sports..." data-testid="input-category" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="teacher"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teacher/Instructor</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="Teacher name" data-testid="input-teacher" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banner Image</FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value || ""}
                        onChange={field.onChange}
                        label="Upload Activity Banner"
                        endpoint="/api/campaigns/upload-image"
                      />
                    </FormControl>
                    <FormDescription>Upload a banner image for your activity</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="scheduleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-schedule-type">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select schedule type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="one_time">One-time</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} data-testid="input-start-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} data-testid="input-end-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {form.watch("scheduleType") === "one_time" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} value={field.value || ""} data-testid="input-start-time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} value={field.value || ""} data-testid="input-end-time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing & Capacity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="isPaid"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Paid Activity</FormLabel>
                      <FormDescription>
                        Charge a fee for this activity
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-is-paid"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {isPaid && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} placeholder="0.00" data-testid="input-price" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || "USD"} data-testid="select-currency">
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="AED">AED (د.إ)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="maxStudents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Students (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="Leave empty for unlimited"
                        data-testid="input-max-students"
                      />
                    </FormControl>
                    <FormDescription>
                      Leave empty for unlimited capacity
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publication</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Publish Activity</FormLabel>
                      <FormDescription>
                        Make this activity visible to the public
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-is-published"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation(`/dashboard/activities/${activityId}`)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              data-testid="button-submit"
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Activity
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
