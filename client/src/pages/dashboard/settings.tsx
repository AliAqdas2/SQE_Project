import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DonationThankYouSettings from "@/pages/dashboard/settings/donation-thank-you";
import StripeConnectionSettings from "@/pages/dashboard/settings/stripe-connection";
import GeneralSettings from "@/pages/dashboard/settings/general-settings";
import NotificationSettings from "@/pages/dashboard/settings/notification-settings";
import { Settings as SettingsIcon, Loader2 } from "lucide-react";

interface SessionResponse {
  user: {
    orgId: string;
  };
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  const { data: sessionData, isLoading } = useQuery<SessionResponse>({
    queryKey: ["/api/auth/session"],
  });

  const orgId = sessionData?.user?.orgId;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Unable to load settings. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-6 h-6 md:w-8 md:h-8 text-primary" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-settings-title">Settings</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage your organization settings and preferences</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-1 h-auto p-1">
          <TabsTrigger value="general" data-testid="tab-general">
            General Settings
          </TabsTrigger>
          <TabsTrigger value="payments" data-testid="tab-payments">
            Payments
          </TabsTrigger>
          <TabsTrigger value="donation-thank-you" data-testid="tab-donation-thank-you">
            Thank You Notes
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <GeneralSettings orgId={orgId} />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <StripeConnectionSettings orgId={orgId} />
        </TabsContent>

        <TabsContent value="donation-thank-you" className="mt-6">
          <DonationThankYouSettings orgId={orgId} />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationSettings orgId={orgId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
