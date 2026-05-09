import { Badge } from "@/components/ui/badge";
import { Smartphone, Wifi, WifiOff, Download, Bell, Zap } from "lucide-react";

const mobileFeatures = [
  {
    icon: Download,
    title: "Install Like an App",
    description: "Add Plegit to your home screen with one tap. No app store required.",
  },
  {
    icon: WifiOff,
    title: "Works Offline",
    description: "Access key features even without internet. Data syncs when you're back online.",
  },
  {
    icon: Bell,
    title: "Push Notifications",
    description: "Get instant alerts for new donations, event registrations, and messages.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimised for mobile networks. Pages load in under a second.",
  },
];

export function MobileFeaturesSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="relative mx-auto w-64">
              <div className="rounded-[2.5rem] border-8 border-foreground/10 bg-card shadow-2xl overflow-hidden">
                <div className="aspect-[9/19] bg-gradient-to-b from-primary/5 to-primary/10 p-4">
                  <div className="h-full rounded-2xl bg-background/80 backdrop-blur-sm border border-border/50 overflow-hidden">
                    <div className="p-4 border-b border-border/50 bg-muted/30">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                          <span className="text-xs font-bold text-primary-foreground">P</span>
                        </div>
                        <span className="font-semibold text-sm">Plegit</span>
                      </div>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 rounded-lg bg-muted/50">
                          <div className="text-xs text-muted-foreground mb-1">Raised</div>
                          <div className="font-bold text-sm">$12,450</div>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <div className="text-xs text-muted-foreground mb-1">Donors</div>
                          <div className="font-bold text-sm">89</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full w-3/4 bg-primary rounded-full" />
                        </div>
                        <div className="text-xs text-muted-foreground text-center">75% of goal</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-8 p-3 rounded-xl border border-border/50 bg-card shadow-xl">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium">Online</span>
                </div>
              </div>
              
              <div className="absolute -top-4 -right-8 p-3 rounded-xl border border-border/50 bg-card shadow-xl">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium">New donation!</span>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="px-4 py-1.5">
                <Smartphone className="w-3.5 h-3.5 mr-1.5" />
                Mobile-First PWA
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold">
                Run Your Organisation From Your Phone
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Plegit is built as a Progressive Web App (PWA), meaning it works beautifully 
                on any device. Install it on your phone, tablet, or computer - no app store needed.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {mobileFeatures.map((feature, index) => (
                <div 
                  key={index} 
                  className="p-4 rounded-lg border border-border/50 bg-card/50 hover-elevate"
                  data-testid={`mobile-feature-${index}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <feature.icon className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
