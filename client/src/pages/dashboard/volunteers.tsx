import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UsersRound, Plus, Search, Mail, Phone, Clock, UserCheck, Users, Calendar } from "lucide-react";
import { useState } from "react";

interface Volunteer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  status: string;
  teams: string[];
  skills: string[];
  state: string | null;
  country: string | null;
  totalHours: number;
  shiftCount: number;
  startDate: string | null;
}

interface SessionResponse {
  user: {
    id: string;
    orgId: string;
  };
}

export default function VolunteersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [skillsFilter, setSkillsFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");

  const { data: session } = useQuery<SessionResponse>({
    queryKey: ["/api/auth/session"],
  });

  const orgId = session?.user?.orgId;

  const queryParams = new URLSearchParams();
  if (searchQuery) queryParams.append("search", searchQuery);
  if (statusFilter !== "all") queryParams.append("status", statusFilter);
  const queryString = queryParams.toString();

  const { data: volunteers, isLoading } = useQuery<Volunteer[]>({
    queryKey: [`/api/org/${orgId}/volunteers${queryString ? `?${queryString}` : ""}`],
    enabled: !!orgId,
  });

  const volunteerList = volunteers || [];

  // Calculate stats
  const stats = {
    total: volunteerList.length,
    active: volunteerList.filter(v => v.status === "active").length,
    totalHours: volunteerList.reduce((sum, v) => sum + v.totalHours, 0),
    avgHours: volunteerList.length > 0 ? Math.round(volunteerList.reduce((sum, v) => sum + v.totalHours, 0) / volunteerList.length) : 0,
  };

  // Get unique values for filters
  const teams = Array.from(new Set(volunteerList.flatMap(v => v.teams || []).filter(Boolean))) as string[];
  const skills = Array.from(new Set(volunteerList.flatMap(v => v.skills || []).filter(Boolean))) as string[];
  const states = Array.from(new Set(volunteerList.map(v => v.state).filter(Boolean))) as string[];
  const countries = Array.from(new Set(volunteerList.map(v => v.country).filter(Boolean))) as string[];

  // Apply filters
  const filteredVolunteers = volunteerList.filter(volunteer => {
    if (statusFilter !== "all" && volunteer.status !== statusFilter) return false;
    if (teamFilter !== "all" && (!volunteer.teams || !volunteer.teams.includes(teamFilter))) return false;
    if (skillsFilter !== "all" && (!volunteer.skills || !volunteer.skills.includes(skillsFilter))) return false;
    if (stateFilter !== "all" && volunteer.state !== stateFilter) return false;
    if (countryFilter !== "all" && volunteer.country !== countryFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const fullName = `${volunteer.firstName} ${volunteer.lastName}`.toLowerCase();
      return fullName.includes(query) || volunteer.email.toLowerCase().includes(query);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold truncate">Volunteers</h1>
          <p className="text-sm md:text-base text-muted-foreground hidden sm:block">
            Manage your volunteer teams and track contributions
          </p>
        </div>
        <Link href="/dashboard/volunteers/create">
          <Button data-testid="button-create-volunteer" className="w-full sm:w-auto shrink-0">
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Add Volunteer</span>
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Volunteers</p>
                <p className="text-2xl font-bold" data-testid="stat-total">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold" data-testid="stat-active">{stats.active}</p>
              </div>
              <UserCheck className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold" data-testid="stat-hours">{stats.totalHours}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Hours/Person</p>
                <p className="text-2xl font-bold" data-testid="stat-avg-hours">{stats.avgHours}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search volunteers..."
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
          {teams.length > 0 && (
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-team-filter">
                <SelectValue placeholder="Filter by team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map(team => (
                  <SelectItem key={team} value={team}>{team}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          {skills.length > 0 && (
            <Select value={skillsFilter} onValueChange={setSkillsFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-skills-filter">
                <SelectValue placeholder="Filter by skills" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Skills</SelectItem>
                {skills.map(skill => (
                  <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {states.length > 0 && (
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-state-filter">
                <SelectValue placeholder="Filter by state/province" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States/Provinces</SelectItem>
                {states.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {countries.length > 0 && (
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-country-filter">
                <SelectValue placeholder="Filter by country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {countries.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Volunteers Grid */}
      {filteredVolunteers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 md:py-16 px-4">
            <UsersRound className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg md:text-xl font-semibold mb-2 text-center">
              {volunteerList.length === 0 ? "No Volunteers Yet" : "No volunteers match your filters"}
            </h3>
            <p className="text-sm md:text-base text-muted-foreground text-center mb-6 max-w-md">
              {volunteerList.length === 0 
                ? "Start building your volunteer team by adding your first volunteer."
                : "Try adjusting your search or filter criteria."
              }
            </p>
            {volunteerList.length === 0 && (
              <Link href="/dashboard/volunteers/create">
                <Button data-testid="button-create-first-volunteer" size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Volunteer
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVolunteers.map((volunteer) => {
            const initials = `${volunteer.firstName[0]}${volunteer.lastName[0]}`;
            const statusColors = {
              active: "bg-green-500/10 text-green-700 dark:text-green-400",
              inactive: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
              on_hold: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
            };

            return (
              <Link key={volunteer.id} href={`/dashboard/volunteers/${volunteer.id}`} data-testid={`link-volunteer-${volunteer.id}`}>
                <Card className="hover-elevate cursor-pointer" data-testid={`card-volunteer-${volunteer.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={volunteer.photoUrl || undefined} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base md:text-lg truncate" data-testid={`text-name-${volunteer.id}`}>
                          {volunteer.firstName} {volunteer.lastName}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={statusColors[volunteer.status as keyof typeof statusColors]} data-testid={`badge-status-${volunteer.id}`}>
                            {volunteer.status === "on_hold" ? "On Hold" : volunteer.status.charAt(0).toUpperCase() + volunteer.status.slice(1)}
                          </Badge>
                          {volunteer.teams && volunteer.teams.length > 0 && volunteer.teams.map((team, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs" data-testid={`badge-team-${volunteer.id}-${idx}`}>
                              {team}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="truncate">{volunteer.email}</span>
                    </div>
                    {volunteer.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4 shrink-0" />
                        <span className="truncate">{volunteer.phone}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Hours</p>
                        <p className="text-base font-semibold" data-testid={`text-hours-${volunteer.id}`}>{volunteer.totalHours}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Shifts</p>
                        <p className="text-base font-semibold" data-testid={`text-shifts-${volunteer.id}`}>{volunteer.shiftCount}</p>
                      </div>
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
