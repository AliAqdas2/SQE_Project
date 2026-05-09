import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, Plus, Search, Users, Coins, Calendar, BookOpen } from "lucide-react";
import { useState } from "react";
import type { Activity } from "@shared/schema";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";

interface SessionResponse {
  user: {
    id: string;
    orgId: string;
  };
}

export default function ActivitiesPage() {
  const { formatCurrency } = useOrganizationLocale();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: session } = useQuery<SessionResponse>({
    queryKey: ["/api/auth/session"],
  });

  const orgId = session?.user?.orgId;

  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
    enabled: !!orgId,
  });

  const activityList = activities || [];

  const stats = {
    total: activityList.length,
    published: activityList.filter(a => a.isPublished).length,
    totalStudents: activityList.reduce((sum, a) => sum + a.currentStudents, 0),
    paid: activityList.filter(a => !a.isFree).length,
  };

  const categories = Array.from(new Set(activityList.map(a => a.category).filter(Boolean))) as string[];

  const filteredActivities = activityList.filter(activity => {
    if (categoryFilter !== "all" && activity.category !== categoryFilter) return false;
    if (statusFilter === "published" && !activity.isPublished) return false;
    if (statusFilter === "draft" && activity.isPublished) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        activity.title.toLowerCase().includes(query) ||
        activity.description?.toLowerCase().includes(query) ||
        activity.teacherName?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold truncate">Activities & Classes</h1>
          <p className="text-sm md:text-base text-muted-foreground hidden sm:block">
            Manage classes, courses, and educational programs
          </p>
        </div>
        <Link href="/dashboard/activities/create">
          <Button data-testid="button-create-activity" className="w-full sm:w-auto shrink-0">
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Add Activity</span>
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Activities</p>
                <p className="text-2xl font-bold" data-testid="stat-total">{stats.total}</p>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold" data-testid="stat-published">{stats.published}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold" data-testid="stat-students">{stats.totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paid Classes</p>
                <p className="text-2xl font-bold" data-testid="stat-paid">{stats.paid}</p>
              </div>
              <Coins className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        {categories.length > 0 && (
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-category-filter">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {filteredActivities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 md:py-16 px-4">
            <GraduationCap className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg md:text-xl font-semibold mb-2 text-center">
              {activityList.length === 0 ? "No Activities Yet" : "No activities match your filters"}
            </h3>
            <p className="text-sm md:text-base text-muted-foreground text-center mb-6 max-w-md">
              {activityList.length === 0 
                ? "Start offering classes and courses to your community."
                : "Try adjusting your search or filter criteria."
              }
            </p>
            {activityList.length === 0 && (
              <Link href="/dashboard/activities/create">
                <Button data-testid="button-create-first-activity" size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Activity
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredActivities.map((activity) => {
            const isFull = activity.maxStudents && activity.currentStudents >= activity.maxStudents;
            
            return (
              <Link key={activity.id} href={`/dashboard/activities/${activity.id}`} data-testid={`link-activity-${activity.id}`}>
                <Card className="hover-elevate cursor-pointer" data-testid={`card-activity-${activity.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base md:text-lg line-clamp-2" data-testid={`text-title-${activity.id}`}>
                        {activity.title}
                      </CardTitle>
                      <Badge variant={activity.isPublished ? "default" : "secondary"} data-testid={`badge-status-${activity.id}`}>
                        {activity.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    {activity.category && (
                      <Badge variant="outline" className="w-fit" data-testid={`badge-category-${activity.id}`}>
                        {activity.category}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {activity.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {activity.description}
                      </p>
                    )}
                    
                    {activity.teacher && (
                      <div className="flex items-center gap-2 text-sm">
                        <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{activity.teacher}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Students</p>
                        <p className="text-base font-semibold" data-testid={`text-students-${activity.id}`}>
                          {activity.currentStudents}
                          {activity.maxStudents && `/${activity.maxStudents}`}
                        </p>
                        {isFull && (
                          <Badge variant="secondary" className="text-xs mt-1">Full</Badge>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Price</p>
                        <p className="text-base font-semibold" data-testid={`text-price-${activity.id}`}>
                          {!activity.isFree ? formatCurrency(parseFloat(activity.price), activity.currency || undefined) : 'Free'}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {activity.scheduleType === 'one_time' ? 'One-time' :
                         activity.scheduleType === 'weekly' ? 'Weekly' :
                         activity.scheduleType === 'daily' ? 'Daily' :
                         activity.scheduleType === 'monthly' ? 'Monthly' : 'Custom'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
