import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Phone, MapPin, Edit, ArrowLeft, Clock, Calendar, Tag, Upload, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useRef, useState } from "react";

interface Volunteer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  bio: string | null;
  status: string;
  teams: string[];
  skills: string[];
  interests: string[];
  totalHours: number;
  shiftCount: number;
  startDate: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  notes: string | null;
  backgroundCheckStatus: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
}

interface SessionResponse {
  user: { orgId: string };
}

export default function VolunteerDetailPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/dashboard/volunteers/:id");
  const { toast } = useToast();
  const volunteerId = params?.id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const { data: session } = useQuery<SessionResponse>({
    queryKey: ["/api/auth/session"],
  });

  const orgId = session?.user?.orgId;

  const { data: volunteer, isLoading, refetch: refetchVolunteer } = useQuery<Volunteer>({
    queryKey: [`/api/org/${orgId}/volunteers/${volunteerId}`],
    enabled: !!volunteerId && !!orgId,
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orgId || !volunteerId) return;

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch(`/api/org/${orgId}/volunteers/${volunteerId}/upload-photo`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to upload photo");
      }

      const { url } = await response.json();
      await refetchVolunteer();
      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload photo",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!volunteer) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Volunteer not found</p>
            <Button onClick={() => navigate("/dashboard/volunteers")} className="mt-4" data-testid="button-back-not-found">
              Back to Volunteers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = `${volunteer.firstName[0]}${volunteer.lastName[0]}`;
  const statusColors = {
    active: "bg-green-500/10 text-green-700 dark:text-green-400",
    inactive: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
    on_hold: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/dashboard/volunteers")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold flex-1">Volunteer Profile</h1>
        <Button
          onClick={() => navigate(`/dashboard/volunteers/${volunteer.id}/edit`)}
          data-testid="button-edit"
        >
          <Edit className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Edit</span>
        </Button>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 md:h-32 md:w-32">
                <AvatarImage src={volunteer.photoUrl || undefined} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center cursor-pointer"
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <Upload className="w-8 h-8 text-white" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold" data-testid="text-name">
                  {volunteer.firstName} {volunteer.lastName}
                </h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge className={statusColors[volunteer.status as keyof typeof statusColors]} data-testid="badge-status">
                    {volunteer.status === "on_hold" ? "On Hold" : volunteer.status.charAt(0).toUpperCase() + volunteer.status.slice(1)}
                  </Badge>
                  {volunteer.teams && volunteer.teams.length > 0 && volunteer.teams.map((team, index) => (
                    <Badge key={index} variant="outline" data-testid={`badge-team-${index}`}>
                      {team}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span data-testid="text-email">{volunteer.email}</span>
                </div>
                {volunteer.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span data-testid="text-phone">{volunteer.phone}</span>
                  </div>
                )}
                {(volunteer.city || volunteer.state) && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {volunteer.city}{volunteer.city && volunteer.state && ", "}{volunteer.state}
                    </span>
                  </div>
                )}
              </div>

              {volunteer.bio && (
                <p className="text-sm text-muted-foreground" data-testid="text-bio">{volunteer.bio}</p>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
              <div className="text-center md:text-right">
                <p className="text-2xl font-bold" data-testid="text-total-hours">{volunteer.totalHours}</p>
                <p className="text-sm text-muted-foreground">Total Hours</p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-2xl font-bold" data-testid="text-shift-count">{volunteer.shiftCount}</p>
                <p className="text-sm text-muted-foreground">Shifts</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="details" data-testid="tabs-volunteer">
        <TabsList className="grid w-full grid-cols-3" data-testid="tabs-list">
          <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
          <TabsTrigger value="skills" data-testid="tab-skills">Skills</TabsTrigger>
          <TabsTrigger value="emergency" data-testid="tab-emergency">Emergency</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Volunteer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Start Date</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-start-date">
                    {volunteer.startDate 
                      ? format(new Date(volunteer.startDate), "MMMM d, yyyy")
                      : "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Background Check</p>
                  {volunteer.backgroundCheckStatus ? (
                    <Badge variant="outline" data-testid="badge-background-check">
                      {volunteer.backgroundCheckStatus.charAt(0).toUpperCase() + volunteer.backgroundCheckStatus.slice(1).replace(/_/g, ' ')}
                    </Badge>
                  ) : (
                    <p className="text-sm text-muted-foreground" data-testid="text-background-check">Not provided</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium">Address</p>
                  {(volunteer.street || volunteer.city || volunteer.state || volunteer.zip || volunteer.country) ? (
                    <p className="text-sm text-muted-foreground" data-testid="text-full-address">
                      {[
                        volunteer.street,
                        [volunteer.city, volunteer.state].filter(Boolean).join(", "),
                        volunteer.zip,
                        volunteer.country
                      ].filter(Boolean).join(" ")}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not provided</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid="text-notes">
                    {volunteer.notes || "No notes added"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle>Skills & Interests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Skills</p>
                {volunteer.skills && volunteer.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {volunteer.skills.map((skill, i) => (
                      <Badge key={i} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No skills added</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Interests</p>
                {volunteer.interests && volunteer.interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {volunteer.interests.map((interest, i) => (
                      <Badge key={i} variant="outline">{interest}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No interests added</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergency">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-emergency-name">
                    {volunteer.emergencyContactName || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-emergency-phone">
                    {volunteer.emergencyContactPhone || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Relationship</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-emergency-relationship">
                    {volunteer.emergencyContactRelationship || "Not provided"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
