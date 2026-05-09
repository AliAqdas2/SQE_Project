import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, CreditCard, LogOut } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  orgId: string;
}

export function ProfileDropdown() {
  const [, setLocation] = useLocation();

  const { data: user } = useQuery<CurrentUser>({
    queryKey: ["/api/me"],
  });

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/logout");
      setLocation("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setLocation("/login");
    }
  };

  if (!user) {
    return null;
  }

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md p-2"
          data-testid="button-profile-dropdown"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left">
            <span className="text-sm font-medium" data-testid="text-user-name">
              {user.firstName} {user.lastName}
            </span>
            <span className="text-xs text-muted-foreground" data-testid="text-user-email">
              {user.email}
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setLocation("/dashboard/profile")}
          data-testid="menu-item-profile"
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLocation("/dashboard/subscription")}
          data-testid="menu-item-billing"
          className="cursor-pointer"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Billing
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          data-testid="menu-item-logout"
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
