import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthGuard } from "@/components/auth-guard";
import { PWAInstallProvider } from "@/hooks/use-pwa-install";
import { PWAInstallBanner } from "@/components/pwa-install-prompt";
import { DashboardLayout } from "@/pages/dashboard/layout";
import { EcoAdminLayout } from "@/pages/eco-admin/layout";
import LandingPage from "@/pages/landing";
import DonatePage from "@/pages/donate";
import DonationSuccessPage from "@/pages/donation-success";
import CampaignPublicPage from "@/pages/campaign-public";
import CampaignWidgetPage from "@/pages/campaign-widget";
import RegisterPage from "@/pages/register";
import SetupPasswordPage from "@/pages/setup-password";
import LoginPage from "@/pages/login";
import AdminRegistrationsPage from "@/pages/admin/registrations";
import AdminMarketplacePage from "@/pages/admin/marketplace";
import EcoAdminLoginPage from "@/pages/eco-admin/login";
import EcoAdminOverviewPage from "@/pages/eco-admin/overview";
import EcoAdminTeamPage from "@/pages/eco-admin/team";
import EcoAdminPartnersPage from "@/pages/eco-admin/partners";
import EcoAdminRevenuePage from "@/pages/eco-admin/revenue";
import EcoAdminSubscriptionPricingPage from "@/pages/eco-admin/subscription-pricing";
import OverviewPage from "@/pages/dashboard/overview";
import CampaignsPage from "@/pages/dashboard/campaigns";
import CreateCampaignPage from "@/pages/dashboard/create-campaign";
import EditCampaignPage from "@/pages/dashboard/edit-campaign";
import CampaignBuilderPage from "@/pages/dashboard/campaign-builder";
import CampaignManagePage from "@/pages/dashboard/campaign-manage";
import P2PManagePage from "@/pages/dashboard/p2p-manage";
import DonorsPage from "@/pages/dashboard/donors";
import DonorDetailPage from "@/pages/dashboard/donor-detail";
import DonorFormPage from "@/pages/dashboard/donor-form";
import EventsPage from "@/pages/dashboard/events";
import CreateEventPage from "@/pages/dashboard/create-event";
import EditEventPage from "@/pages/dashboard/edit-event";
import ManageEventPage from "@/pages/dashboard/manage-event";
import PublicEventPage from "@/pages/public-event";
import EventRegisterPage from "@/pages/event-register";
import EventRegistrationSuccessPage from "@/pages/event-registration-success";
import LivestreamViewPage from "@/pages/livestream-view";
import P2PParticipantPublicPage from "@/pages/p2p-participant-public";
import P2PSignupPage from "@/pages/p2p-signup";
import LivestreamsPage from "@/pages/dashboard/livestreams";
import CreateLivestreamPage from "@/pages/dashboard/create-livestream";
import EditLivestreamPage from "@/pages/dashboard/edit-livestream";
import ManageLivestreamPage from "@/pages/dashboard/manage-livestream";
import MarketplacePage from "@/pages/dashboard/marketplace";
import SubscriptionPage from "@/pages/dashboard/subscription";
import ContactsPage from "@/pages/dashboard/contacts";
import ContactDetailPage from "@/pages/dashboard/contact-detail";
import ContactFormPage from "@/pages/dashboard/contact-form";
import PrayerSettingsPage from "@/pages/dashboard/prayer-settings";
import SettingsPage from "@/pages/dashboard/settings";
import LandingPageBuilderPage from "@/pages/dashboard/landing-page-builder";
import PublicLandingPageView from "@/pages/public-landing-page";
import DonationsPage from "@/pages/dashboard/donations";
import DonationFormPage from "@/pages/dashboard/donation-form";
import GiftAidReportPage from "@/pages/dashboard/gift-aid-report";
import EmailBuilder from "@/pages/dashboard/email-builder";
import EmailCampaignsPage from "@/pages/dashboard/email-campaigns";
import EmailMetricsPage from "@/pages/dashboard/email-metrics";
import SermonsPage from "@/pages/dashboard/sermons";
import SermonDetailPage from "@/pages/dashboard/sermon-detail";
import SermonFormPage from "@/pages/dashboard/sermon-form";
import ProfilePage from "@/pages/dashboard/profile";
import VolunteersPage from "@/pages/dashboard/volunteers";
import VolunteerDetailPage from "@/pages/dashboard/volunteer-detail";
import VolunteerFormPage from "@/pages/dashboard/volunteer-form";
import PrayerWallPage from "@/pages/dashboard/prayer-wall";
import BeneficiariesPage from "@/pages/dashboard/beneficiaries";
import BeneficiaryDetailPage from "@/pages/dashboard/beneficiary-detail";
import BeneficiaryFormPage from "@/pages/dashboard/beneficiary-form";
import BeneficiaryReportPage from "@/pages/dashboard/beneficiary-report";
import ActivitiesPage from "@/pages/dashboard/activities";
import CreateActivityPage from "@/pages/dashboard/create-activity";
import EditActivityPage from "@/pages/dashboard/edit-activity";
import ManageActivityPage from "@/pages/dashboard/manage-activity";
import ActivityPaymentsPage from "@/pages/dashboard/activity-payments";
import AnalyticsDashboard from "@/pages/dashboard/analytics-dashboard";
import OnboardingPage from "@/pages/onboarding";
import CampaignManagementToolPage from "@/pages/tools/campaigns";
import DonorCRMToolPage from "@/pages/tools/donor-crm";
import EventTicketingToolPage from "@/pages/tools/events";
import LivestreamGivingToolPage from "@/pages/tools/livestream";
import QRDonationsToolPage from "@/pages/tools/qr-donations";
import AnalyticsDashboardToolPage from "@/pages/tools/analytics";
import VolunteerManagementToolPage from "@/pages/tools/volunteers";
import BeneficiaryTrackingToolPage from "@/pages/tools/beneficiaries";
import ClassesActivitiesToolPage from "@/pages/tools/classes";
import EmailCampaignsToolPage from "@/pages/tools/email-campaigns";
import MediaLibraryToolPage from "@/pages/tools/media-library";
import AIChatbotToolPage from "@/pages/tools/ai-chatbot";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/setup-password" component={SetupPasswordPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/eco-admin/login" component={EcoAdminLoginPage} />
      <Route path="/c/:slug/:campaignId" component={CampaignPublicPage} />
      <Route path="/widget/:campaignId" component={CampaignWidgetPage} />
      <Route path="/donate/:campaignId" component={DonatePage} />
      <Route path="/donation/success" component={DonationSuccessPage} />
      <Route path="/events/:eventId" component={PublicEventPage} />
      <Route path="/events/:eventId/register" component={EventRegisterPage} />
      <Route path="/event-registration-success" component={EventRegistrationSuccessPage} />
      <Route path="/livestreams/:id" component={LivestreamViewPage} />
      <Route path="/p/:slug" component={PublicLandingPageView} />
      <Route path="/p2p/:slug" component={P2PParticipantPublicPage} />
      <Route path="/p2p/signup/:campaignId" component={P2PSignupPage} />
      <Route path="/tools/campaigns" component={CampaignManagementToolPage} />
      <Route path="/tools/donor-crm" component={DonorCRMToolPage} />
      <Route path="/tools/events" component={EventTicketingToolPage} />
      <Route path="/tools/livestream" component={LivestreamGivingToolPage} />
      <Route path="/tools/qr-donations" component={QRDonationsToolPage} />
      <Route path="/tools/analytics" component={AnalyticsDashboardToolPage} />
      <Route path="/tools/volunteers" component={VolunteerManagementToolPage} />
      <Route path="/tools/beneficiaries" component={BeneficiaryTrackingToolPage} />
      <Route path="/tools/classes" component={ClassesActivitiesToolPage} />
      <Route path="/tools/email-campaigns" component={EmailCampaignsToolPage} />
      <Route path="/tools/media-library" component={MediaLibraryToolPage} />
      <Route path="/tools/ai-chatbot" component={AIChatbotToolPage} />
      <Route path="/onboarding">
        <AuthGuard>
          <OnboardingPage />
        </AuthGuard>
      </Route>
      <Route path="/admin/registrations">
        <AuthGuard requiredRole="eco_admin">
          <AdminRegistrationsPage />
        </AuthGuard>
      </Route>
      <Route path="/admin/marketplace">
        <AuthGuard requiredRole="eco_admin">
          <AdminMarketplacePage />
        </AuthGuard>
      </Route>
      <Route path="/eco-admin">
        <AuthGuard requiredRole="eco_admin">
          <EcoAdminLayout>
            <EcoAdminOverviewPage />
          </EcoAdminLayout>
        </AuthGuard>
      </Route>
      <Route path="/eco-admin/overview">
        <AuthGuard requiredRole="eco_admin">
          <EcoAdminLayout>
            <EcoAdminOverviewPage />
          </EcoAdminLayout>
        </AuthGuard>
      </Route>
      <Route path="/eco-admin/registrations">
        <AuthGuard requiredRole="eco_admin">
          <EcoAdminLayout>
            <AdminRegistrationsPage />
          </EcoAdminLayout>
        </AuthGuard>
      </Route>
      <Route path="/eco-admin/team">
        <AuthGuard requiredRole="eco_admin">
          <EcoAdminLayout>
            <EcoAdminTeamPage />
          </EcoAdminLayout>
        </AuthGuard>
      </Route>
      <Route path="/eco-admin/partners">
        <AuthGuard requiredRole="eco_admin">
          <EcoAdminLayout>
            <EcoAdminPartnersPage />
          </EcoAdminLayout>
        </AuthGuard>
      </Route>
      <Route path="/eco-admin/revenue">
        <AuthGuard requiredRole="eco_admin">
          <EcoAdminLayout>
            <EcoAdminRevenuePage />
          </EcoAdminLayout>
        </AuthGuard>
      </Route>
      <Route path="/eco-admin/subscription-pricing">
        <AuthGuard requiredRole="eco_admin">
          <EcoAdminLayout>
            <EcoAdminSubscriptionPricingPage />
          </EcoAdminLayout>
        </AuthGuard>
      </Route>
      <Route path="/eco-admin/marketplace">
        <AuthGuard requiredRole="eco_admin">
          <EcoAdminLayout>
            <AdminMarketplacePage />
          </EcoAdminLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard">
        <AuthGuard>
          <DashboardLayout>
            <OverviewPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/campaigns">
        <AuthGuard>
          <DashboardLayout>
            <CampaignsPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/campaigns/create">
        <AuthGuard>
          <DashboardLayout>
            <CreateCampaignPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/campaigns/:id/edit">
        <AuthGuard>
          <DashboardLayout>
            <EditCampaignPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/campaigns/:id/builder">
        <AuthGuard>
          <DashboardLayout>
            <CampaignBuilderPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/campaigns/:id/manage">
        <AuthGuard>
          <DashboardLayout>
            <CampaignManagePage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/campaigns/:campaignId/p2p">
        <AuthGuard>
          <DashboardLayout>
            <P2PManagePage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/donors/create">
        <AuthGuard>
          <DashboardLayout>
            <DonorFormPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/donors/:id/edit">
        <AuthGuard>
          <DashboardLayout>
            <DonorFormPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/donors/:id">
        <AuthGuard>
          <DashboardLayout>
            <DonorDetailPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/donors">
        <AuthGuard>
          <DashboardLayout>
            <DonorsPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/events/create">
        <AuthGuard>
          <DashboardLayout>
            <CreateEventPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/events/:eventId/edit">
        <AuthGuard>
          <DashboardLayout>
            <EditEventPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/events/:eventId/manage">
        <AuthGuard>
          <DashboardLayout>
            <ManageEventPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/events">
        <AuthGuard>
          <DashboardLayout>
            <EventsPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/livestreams">
        <AuthGuard>
          <DashboardLayout>
            <LivestreamsPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/livestreams/create">
        <AuthGuard>
          <DashboardLayout>
            <CreateLivestreamPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/livestreams/:id/edit">
        <AuthGuard>
          <DashboardLayout>
            <EditLivestreamPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/livestreams/:id/manage">
        <AuthGuard>
          <DashboardLayout>
            <ManageLivestreamPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/marketplace">
        <AuthGuard>
          <DashboardLayout>
            <MarketplacePage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/subscription">
        <AuthGuard>
          <DashboardLayout>
            <SubscriptionPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/contacts">
        <AuthGuard>
          <DashboardLayout>
            <ContactsPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/contacts/create">
        <AuthGuard>
          <DashboardLayout>
            <ContactFormPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/contacts/:id">
        <AuthGuard>
          <DashboardLayout>
            <ContactDetailPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/contacts/:id/edit">
        <AuthGuard>
          <DashboardLayout>
            <ContactFormPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/donations">
        <AuthGuard>
          <DashboardLayout>
            <DonationsPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/donations/new">
        <AuthGuard>
          <DashboardLayout>
            <DonationFormPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/donations/:id/edit">
        <AuthGuard>
          <DashboardLayout>
            <DonationFormPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/gift-aid-report">
        <AuthGuard>
          <DashboardLayout>
            <GiftAidReportPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/email-builder">
        <AuthGuard>
          <DashboardLayout>
            <EmailBuilder />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/email-builder/:id">
        <AuthGuard>
          <DashboardLayout>
            <EmailBuilder />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/email-campaigns">
        <AuthGuard>
          <DashboardLayout>
            <EmailCampaignsPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/email-metrics">
        <AuthGuard>
          <DashboardLayout>
            <EmailMetricsPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/sermons">
        <AuthGuard>
          <DashboardLayout>
            <SermonsPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/sermons/create">
        <AuthGuard>
          <DashboardLayout>
            <SermonFormPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/sermons/:id">
        <AuthGuard>
          <DashboardLayout>
            <SermonDetailPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/sermons/:id/edit">
        <AuthGuard>
          <DashboardLayout>
            <SermonFormPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/profile">
        <AuthGuard>
          <DashboardLayout>
            <ProfilePage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/volunteers">
        <AuthGuard>
          <DashboardLayout>
            <VolunteersPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/volunteers/create">
        <AuthGuard>
          <DashboardLayout>
            <VolunteerFormPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/volunteers/:id">
        <AuthGuard>
          <DashboardLayout>
            <VolunteerDetailPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/volunteers/:id/edit">
        <AuthGuard>
          <DashboardLayout>
            <VolunteerFormPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/prayer-wall">
        <AuthGuard>
          <DashboardLayout>
            <PrayerWallPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/beneficiaries">
        <AuthGuard>
          <DashboardLayout>
            <BeneficiariesPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/beneficiaries/create">
        <AuthGuard>
          <DashboardLayout>
            <BeneficiaryFormPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/beneficiaries/:id/report">
        <AuthGuard>
          <DashboardLayout>
            <BeneficiaryReportPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/beneficiaries/:id">
        <AuthGuard>
          <DashboardLayout>
            <BeneficiaryDetailPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/beneficiaries/:id/edit">
        <AuthGuard>
          <DashboardLayout>
            <BeneficiaryFormPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/prayer-settings">
        <AuthGuard>
          <DashboardLayout>
            <PrayerSettingsPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/settings">
        <AuthGuard>
          <DashboardLayout>
            <SettingsPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/landing-page">
        <AuthGuard>
          <DashboardLayout>
            <LandingPageBuilderPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/activities">
        <AuthGuard>
          <DashboardLayout>
            <ActivitiesPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/activities/create">
        <AuthGuard>
          <DashboardLayout>
            <CreateActivityPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/activities/:id">
        <AuthGuard>
          <DashboardLayout>
            <ManageActivityPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/activities/:id/edit">
        <AuthGuard>
          <DashboardLayout>
            <EditActivityPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/activities/:id/payments">
        <AuthGuard>
          <DashboardLayout>
            <ActivityPaymentsPage />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route path="/dashboard/analytics">
        <AuthGuard>
          <DashboardLayout>
            <AnalyticsDashboard />
          </DashboardLayout>
        </AuthGuard>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="plegit-theme">
        <PWAInstallProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <PWAInstallBanner />
          </TooltipProvider>
        </PWAInstallProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
