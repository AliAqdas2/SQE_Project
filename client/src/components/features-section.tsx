import { QrCode, Smartphone, Users, TrendingUp, Heart, Zap } from "lucide-react";

const features = [
  {
    icon: QrCode,
    title: "QR Code Donations",
    description: "Donors give in seconds by scanning QR codes at events, livestreams, or anywhere.",
  },
  {
    icon: Smartphone,
    title: "PWA Mobile-First",
    description: "Install on any device. Works offline. Feels like a native app.",
  },
  {
    icon: Users,
    title: "Donor CRM",
    description: "Manage donors, track giving history, and build stronger relationships.",
  },
  {
    icon: TrendingUp,
    title: "Campaign Management",
    description: "Create unlimited campaigns with goals, progress tracking, and analytics.",
  },
  {
    icon: Heart,
    title: "Event Ticketing",
    description: "Sell tickets, manage registrations, and collect donations at events.",
  },
  {
    icon: Zap,
    title: "AI Assistant",
    description: "Get insights, optimize campaigns, and answer questions with AI.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything You Need to Fundraise
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A comprehensive platform designed specifically for faith-based organizations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-6 rounded-lg hover-elevate transition-all"
              data-testid={`feature-${index}`}
            >
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
