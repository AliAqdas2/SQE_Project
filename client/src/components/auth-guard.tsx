import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "org_admin" | "eco_admin";
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  orgId: string | null;
}

interface SessionResponse {
  user: User;
  audience: "eco_admin" | "org_portal";
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const [location, setLocation] = useLocation();

  const { data: session, isLoading, error } = useQuery<SessionResponse>({
    queryKey: ["/api/auth/session"],
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && (error || !session)) {
      // Save intended destination before redirecting to login
      sessionStorage.setItem('redirectAfterLogin', location);
      // Redirect to appropriate login portal
      const isEcoAdminRoute = location.startsWith("/eco-admin");
      const loginPath = isEcoAdminRoute ? "/eco-admin/login" : "/login";
      setLocation(loginPath);
    }
  }, [isLoading, error, session, setLocation, location]);

  useEffect(() => {
    if (!isLoading && session) {
      const user = session.user;
      const audience = session.audience;

      // Enforce audience-based portal access
      const isEcoAdminRoute = location.startsWith("/eco-admin") && !location.startsWith("/eco-admin/login");
      const isOrgRoute = location.startsWith("/dashboard") || location.startsWith("/admin");

      if (isEcoAdminRoute && audience !== "eco_admin") {
        // Org users trying to access eco-admin portal
        setLocation("/dashboard");
        return;
      }

      if (isOrgRoute && audience === "eco_admin") {
        // Eco admin users trying to access org portal
        setLocation("/eco-admin");
        return;
      }

      // Check role-based access for specific routes
      if (requiredRole && user.role !== requiredRole) {
        // Redirect to appropriate dashboard based on role
        const redirectPath = user.role === "eco_admin" ? "/eco-admin" : "/dashboard";
        setLocation(redirectPath);
      }
    }
  }, [isLoading, session, requiredRole, setLocation, location]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" data-testid="loading-auth" />
      </div>
    );
  }

  if (error || !session) {
    return null;
  }

  if (requiredRole && session.user.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}
