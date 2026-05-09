import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Shield, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function EcoAdminLoginPage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest("POST", "/api/auth/login", { 
        email, 
        password,
        audience: "eco_admin" 
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Verify user has eco_admin role
      if (data.user?.role !== "eco_admin") {
        toast({
          title: "Access Denied",
          description: "This login portal is for Eco Admin team members only. Please use the organization portal to log in.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      toast({
        title: "Welcome to Eco Admin",
        description: "Login successful.",
      });

      // Invalidate session cache to ensure fresh data on redirect
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });

      // Always redirect eco_admin users to eco-admin dashboard
      setTimeout(() => {
        setLocation("/eco-admin");
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password. Ensure you have Eco Admin access.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-700">
        <CardHeader>
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-amber-500/20">
            <Shield className="w-8 h-8 text-amber-500" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <CardTitle className="text-2xl text-center" data-testid="text-ecoadmin-login-title">
              Eco Admin Portal
            </CardTitle>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
              Staff Only
            </Badge>
          </div>
          <CardDescription className="text-center text-slate-400">
            Platform administration access for Plegit team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                data-testid="input-ecoadmin-email"
                type="email"
                placeholder="admin@plegit.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  data-testid="input-ecoadmin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-ecoadmin-password"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700"
              disabled={isSubmitting}
              data-testid="button-ecoadmin-login"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying credentials...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Sign In
                </>
              )}
            </Button>

            <div className="text-center text-sm text-slate-400 mt-6 pt-4 border-t border-slate-700">
              Not an admin?{" "}
              <a href="/login" className="text-primary hover:underline" data-testid="link-org-login">
                Access organization portal
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
