import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Bell, Mail, Coins, Users, Calendar, Heart, FileText, Loader2 } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  settings: {
    notifications?: NotificationPreferences;
  } | null;
}

interface NotificationPreferences {
  emailNewDonation: boolean;
  emailNewDonor: boolean;
  emailEventRegistration: boolean;
  emailVolunteerSignup: boolean;
  emailWeeklySummary: boolean;
  emailMonthlySummary: boolean;
  emailDonorMilestones: boolean;
  emailCampaignGoalReached: boolean;
}

const defaultPreferences: NotificationPreferences = {
  emailNewDonation: true,
  emailNewDonor: true,
  emailEventRegistration: true,
  emailVolunteerSignup: true,
  emailWeeklySummary: false,
  emailMonthlySummary: true,
  emailDonorMilestones: true,
  emailCampaignGoalReached: true,
};

interface NotificationSettingsProps {
  orgId: string;
}

export default function NotificationSettings({ orgId }: NotificationSettingsProps) {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: organization, isLoading } = useQuery<Organization>({
    queryKey: [`/api/org/${orgId}`],
    enabled: !!orgId,
  });

  useEffect(() => {
    if (organization?.settings?.notifications) {
      setPreferences({ ...defaultPreferences, ...organization.settings.notifications });
    }
  }, [organization]);

  const updateMutation = useMutation({
    mutationFn: async (newPreferences: NotificationPreferences) => {
      const currentSettings = organization?.settings || {};
      const response = await apiRequest("PATCH", `/api/organizations/${orgId}`, {
        settings: {
          ...currentSettings,
          notifications: newPreferences,
        },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/org/${orgId}`] });
      setHasChanges(false);
      toast({
        title: "Notifications Updated",
        description: "Your notification preferences have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save notification preferences",
        variant: "destructive",
      });
    },
  });

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMutation.mutate(preferences);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Donation Notifications
          </CardTitle>
          <CardDescription>
            Get notified about donation activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNewDonation" className="text-base">New Donations</Label>
              <p className="text-sm text-muted-foreground">
                Receive an email whenever a new donation is made
              </p>
            </div>
            <Switch
              id="emailNewDonation"
              checked={preferences.emailNewDonation}
              onCheckedChange={() => handleToggle("emailNewDonation")}
              data-testid="switch-new-donation"
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNewDonor" className="text-base">New Donors</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when a first-time donor contributes
              </p>
            </div>
            <Switch
              id="emailNewDonor"
              checked={preferences.emailNewDonor}
              onCheckedChange={() => handleToggle("emailNewDonor")}
              data-testid="switch-new-donor"
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailDonorMilestones" className="text-base">Donor Milestones</Label>
              <p className="text-sm text-muted-foreground">
                Celebrate when donors reach giving milestones (e.g., $1,000 total)
              </p>
            </div>
            <Switch
              id="emailDonorMilestones"
              checked={preferences.emailDonorMilestones}
              onCheckedChange={() => handleToggle("emailDonorMilestones")}
              data-testid="switch-donor-milestones"
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailCampaignGoalReached" className="text-base">Campaign Goals Reached</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when a campaign reaches its fundraising goal
              </p>
            </div>
            <Switch
              id="emailCampaignGoalReached"
              checked={preferences.emailCampaignGoalReached}
              onCheckedChange={() => handleToggle("emailCampaignGoalReached")}
              data-testid="switch-campaign-goal"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Event & Volunteer Notifications
          </CardTitle>
          <CardDescription>
            Stay informed about event registrations and volunteer activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailEventRegistration" className="text-base">Event Registrations</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications when someone registers for an event
              </p>
            </div>
            <Switch
              id="emailEventRegistration"
              checked={preferences.emailEventRegistration}
              onCheckedChange={() => handleToggle("emailEventRegistration")}
              data-testid="switch-event-registration"
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailVolunteerSignup" className="text-base">Volunteer Sign-ups</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when new volunteers sign up
              </p>
            </div>
            <Switch
              id="emailVolunteerSignup"
              checked={preferences.emailVolunteerSignup}
              onCheckedChange={() => handleToggle("emailVolunteerSignup")}
              data-testid="switch-volunteer-signup"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Summary Reports
          </CardTitle>
          <CardDescription>
            Receive periodic summary reports of your organization's activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailWeeklySummary" className="text-base">Weekly Summary</Label>
              <p className="text-sm text-muted-foreground">
                Receive a weekly digest every Monday morning
              </p>
            </div>
            <Switch
              id="emailWeeklySummary"
              checked={preferences.emailWeeklySummary}
              onCheckedChange={() => handleToggle("emailWeeklySummary")}
              data-testid="switch-weekly-summary"
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailMonthlySummary" className="text-base">Monthly Summary</Label>
              <p className="text-sm text-muted-foreground">
                Receive a monthly report on the 1st of each month
              </p>
            </div>
            <Switch
              id="emailMonthlySummary"
              checked={preferences.emailMonthlySummary}
              onCheckedChange={() => handleToggle("emailMonthlySummary")}
              data-testid="switch-monthly-summary"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || updateMutation.isPending}
          data-testid="button-save-notifications"
        >
          {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
