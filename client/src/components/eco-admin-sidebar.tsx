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
  Users, 
  UserCog, 
  Coins, 
  Package, 
  FileCheck, 
  LogOut, 
  Handshake,
  CreditCard
} from "lucide-react";
import { Link, useLocation } from "wouter";
import logoImage from "@assets/Plegit Logo Blue_1761395766884.png";
import { ThemeToggle } from "./theme-toggle";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  {
    title: "Overview",
    url: "/eco-admin",
    icon: LayoutDashboard,
  },
  {
    title: "Organizations",
    url: "/eco-admin/registrations",
    icon: FileCheck,
  },
  {
    title: "Team Members",
    url: "/eco-admin/team",
    icon: UserCog,
  },
  {
    title: "Partners",
    url: "/eco-admin/partners",
    icon: Handshake,
  },
  {
    title: "Revenue",
    url: "/eco-admin/revenue",
    icon: Coins,
  },
  {
    title: "Subscription Pricing",
    url: "/eco-admin/subscription-pricing",
    icon: CreditCard,
  },
  {
    title: "Marketplace",
    url: "/eco-admin/marketplace",
    icon: Package,
  },
];

export function EcoAdminSidebar() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();

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
        <div className="flex items-center gap-2">
          <img src={logoImage} alt="Plegit" className="h-8 w-auto object-contain" />
          <span className="text-xs font-semibold text-primary">ECO ADMIN</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Eco Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url} data-testid={`link-eco-${item.title.toLowerCase().replace(' ', '-')}`}>
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
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Eco Admin</span>
          <ThemeToggle />
        </div>
        <SidebarMenuButton onClick={handleLogout} data-testid="button-eco-logout">
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
