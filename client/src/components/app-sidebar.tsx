import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Heart, 
  Users, 
  Calendar, 
  Settings, 
  LogOut, 
  ShoppingBag, 
  UserCircle,
  Video,
  BarChart3,
  QrCode,
  UsersRound,
  Globe,
  Receipt,
  Mail,
  HandHeart,
  FileText,
  MessageSquareHeart,
  CreditCard,
  BookOpen,
  Building2,
  Sparkles
} from "lucide-react";
import { Link, useLocation } from "wouter";
import logoImage from "@assets/Plegit Logo Blue_1761395766884.png";
import { ThemeToggle } from "./theme-toggle";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EnabledModule {
  id: string;
  orgId: string;
  moduleId: string;
  enabledAt: string;
  status: string;
  module: {
    id: string;
    moduleKey: string;
    title: string;
    description: string;
    isDefault: boolean;
  };
}

interface Organization {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
}

interface SubscriptionInfo {
  subscription: {
    id: string;
    planId: string;
    status: string;
  };
  plan: {
    id: string;
    tierCode: string;
    name: string;
  };
}

// Core menu items that are always visible (free plan included)
const coreMenuItems = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Landing Page",
    url: "/dashboard/landing-page",
    icon: Globe,
  },
  {
    title: "Donors",
    url: "/dashboard/donors",
    icon: Users,
  },
  {
    title: "Contacts",
    url: "/dashboard/contacts",
    icon: UserCircle,
  },
  {
    title: "Donations",
    url: "/dashboard/donations",
    icon: Receipt,
  },
  {
    title: "Tax Relief Report",
    url: "/dashboard/gift-aid-report",
    icon: FileText,
  },
];

// Paid plan menu items (requires subscription)
const paidMenuItems = [
  {
    title: "Campaigns",
    url: "/dashboard/campaigns",
    icon: Heart,
  },
];

// Module-based menu items that only show when the module is enabled
const moduleMenuItems: Record<string, {
  title: string;
  url: string;
  icon: any;
}> = {
  events: {
    title: "Events",
    url: "/dashboard/events",
    icon: Calendar,
  },
  livestream: {
    title: "Livestreams",
    url: "/dashboard/livestreams",
    icon: Video,
  },
  analytics: {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
  },
  qr_donations: {
    title: "QR Donations",
    url: "/dashboard/qr-donations",
    icon: QrCode,
  },
  volunteer_management: {
    title: "Volunteers",
    url: "/dashboard/volunteers",
    icon: UsersRound,
  },
  beneficiaries: {
    title: "Beneficiaries",
    url: "/dashboard/beneficiaries",
    icon: HandHeart,
  },
  prayer_timetable: {
    title: "Prayer Times",
    url: "/dashboard/prayer-settings",
    icon: QrCode,
  },
  prayer_wall: {
    title: "Prayer Wall",
    url: "/dashboard/prayer-wall",
    icon: MessageSquareHeart,
  },
  activities: {
    title: "Activities",
    url: "/dashboard/activities",
    icon: Calendar,
  },
  sermon_library: {
    title: "Sermons",
    url: "/dashboard/sermons",
    icon: BookOpen,
  },
  email_builder: {
    title: "Email Campaigns",
    url: "/dashboard/email-campaigns",
    icon: Mail,
  },
};

// System menu items that are always at the bottom
const systemMenuItems = [
  {
    title: "Subscription",
    url: "/dashboard/subscription",
    icon: CreditCard,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  // Get current user session to retrieve orgId
  const { data: session } = useQuery<{ user: { orgId: string } }>({
    queryKey: ["/api/auth/session"],
  });

  const orgId = session?.user?.orgId;

  // Fetch organization details for branding
  const { data: organization } = useQuery<Organization>({
    queryKey: ["/api/org"],
    enabled: !!orgId,
  });

  // Fetch subscription info to check plan tier
  const { data: subscriptionInfo } = useQuery<SubscriptionInfo>({
    queryKey: ["/api/org", orgId, "subscription"],
    enabled: !!orgId,
  });

  // Check if user is on free plan
  const isFreePlan = subscriptionInfo?.plan?.tierCode?.toLowerCase() === "free";

  // Fetch enabled modules for the organization
  const { data: enabledModules } = useQuery<EnabledModule[]>({
    queryKey: [`/api/org/${orgId}/modules`],
    enabled: !!orgId,
  });

  // Build dynamic menu items based on enabled modules
  const dynamicModuleItems = enabledModules
    ?.map((enabledModule) => {
      const moduleKey = enabledModule.module.moduleKey;
      return moduleMenuItems[moduleKey];
    })
    .filter(Boolean) || [];

  // Combine all menu items - include paid items only for non-free plans
  const allMenuItems = [
    ...coreMenuItems,
    ...(isFreePlan ? [] : paidMenuItems),
    ...dynamicModuleItems,
    ...systemMenuItems,
  ];

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      // Clear session cache
      queryClient.setQueryData(["/api/auth/session"], null);
      sessionStorage.clear();
      navigate("/login");
      window.location.reload();
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {organization?.logoUrl ? (
              <Avatar className="h-9 w-9 rounded-lg shrink-0">
                <AvatarImage src={organization.logoUrl} alt={organization.name} className="object-contain" />
                <AvatarFallback className="rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <img src={logoImage} alt="Plegit" className="h-8 w-auto object-contain shrink-0" />
            )}
            {organization?.logoUrl && (
              <span className="font-semibold text-sm truncate" data-testid="text-org-name-sidebar">
                {organization.name}
              </span>
            )}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 bg-gradient-to-r from-primary/10 to-violet-500/10 border-primary/20 hover:border-primary/40"
                onClick={() => navigate("/dashboard/marketplace")}
                data-testid="button-marketplace"
              >
                <Sparkles className="h-4 w-4 text-primary" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Marketplace - Add features to your platform</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {allMenuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground truncate" data-testid="text-org-name-footer">
            {organization?.name || "Dashboard"}
          </span>
          <ThemeToggle />
        </div>
        <SidebarMenuButton onClick={handleLogout} data-testid="button-logout">
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
