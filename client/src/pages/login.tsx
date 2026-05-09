import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, LogIn, Eye, EyeOff, QrCode, Users, TrendingUp, Zap, BarChart3, HeartHandshake } from "lucide-react";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";

export default function LoginPage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);

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
        audience: "org_portal"
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Block eco_admin users from organization portal
      if (data.user?.role === "eco_admin") {
        toast({
          title: "Wrong Portal",
          description: "Eco Admin users must use the admin portal. Redirecting...",
          variant: "destructive",
        });
        setTimeout(() => {
          setLocation("/eco-admin/login");
        }, 2000);
        return;
      }

      toast({
        title: "Welcome back!",
        description: "Login successful.",
      });

      // Invalidate session cache to ensure fresh data on redirect
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });

      // Check if there's a saved redirect URL, otherwise use default
      const savedRedirect = sessionStorage.getItem('redirectAfterLogin');
      let redirectPath = "/dashboard";
      
      if (savedRedirect && savedRedirect !== '/login') {
        redirectPath = savedRedirect;
        sessionStorage.removeItem('redirectAfterLogin');
      }

      // Show PWA install prompt before redirecting
      setShowPWAPrompt(true);
      
      setTimeout(() => {
        setLocation(redirectPath);
      }, 4000);
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: QrCode,
      title: "Instant QR Donations",
      description: "Accept donations anywhere with simple QR codes"
    },
    {
      icon: Users,
      title: "Peer-to-Peer Fundraising",
      description: "Empower supporters to raise funds on your behalf"
    },
    {
      icon: TrendingUp,
      title: "Multi-Currency Support",
      description: "Accept donations in GBP, USD, AED, PKR and more"
    },
    {
      icon: Zap,
      title: "AI-Powered Campaigns",
      description: "Generate compelling campaign content with AI"
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description: "Track donations and engagement in real-time"
    },
    {
      icon: HeartHandshake,
      title: "Donor Relationships",
      description: "Build lasting connections with your supporters"
    }
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 flex-col justify-center">
        <div className="max-w-xl w-full px-8 py-12 lg:px-16 xl:px-24 xl:py-20">
          <h1 className="text-4xl font-bold mb-3">PLEGIT</h1>
          <p className="text-xl text-muted-foreground mb-12">
            Modern fundraising platform for faith-based organizations
          </p>
          
          <div className="space-y-10">
            {features.map((feature, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-none lg:border lg:shadow-sm">
          <CardHeader>
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center" data-testid="text-login-title">
              Sign in to Plegit
            </CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your organization dashboard
            </CardDescription>
            <div className="text-center mt-2">
              <a href="/eco-admin/login" className="text-xs text-muted-foreground hover:text-primary" data-testid="link-admin-portal">
                Eco Admin? Access admin portal →
              </a>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  data-testid="input-email"
                  type="email"
                  placeholder="your@email.com"
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
                    data-testid="input-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-2 pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
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
                className="w-full"
                disabled={isSubmitting}
                data-testid="button-login"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/register">
                  <a className="text-primary hover:underline" data-testid="link-register">
                    Register your organization
                  </a>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      
      <PWAInstallPrompt trigger="login" showImmediately={showPWAPrompt} />
    </div>
  );
}
