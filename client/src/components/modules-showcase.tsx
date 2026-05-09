import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  Target, 
  Users, 
  Calendar, 
  Radio, 
  HandHeart, 
  GraduationCap, 
  UserCheck, 
  QrCode,
  BarChart3,
  Mail,
  BookOpen,
  Sparkles,
  ArrowRight,
  ToggleRight
} from "lucide-react";

const modules = [
  {
    icon: Target,
    title: "Campaign Management",
    description: "Create and manage fundraising campaigns with AI-powered descriptions, goal tracking, and donor engagement tools.",
    category: "Core",
    link: "/tools/campaigns"
  },
  {
    icon: Users,
    title: "Donor CRM",
    description: "Track donor relationships, giving history, and engagement. Send personalised thank-you messages automatically.",
    category: "Core",
  },
  {
    icon: QrCode,
    title: "QR Code Donations",
    description: "Generate instant QR codes for events, print materials, or livestreams. Donors give in seconds.",
    category: "Donations",
  },
  {
    icon: Calendar,
    title: "Event Ticketing",
    description: "Sell tickets, manage registrations, and handle check-ins with QR codes. Multi-currency support included.",
    category: "Events",
  },
  {
    icon: Radio,
    title: "Livestream Giving",
    description: "Accept real-time donations during livestreams. Integrates with popular streaming platforms.",
    category: "Donations",
  },
  {
    icon: HandHeart,
    title: "Volunteer Management",
    description: "Coordinate volunteers, track hours, and manage schedules. Perfect for community outreach.",
    category: "People",
  },
  {
    icon: UserCheck,
    title: "Beneficiary Tracking",
    description: "Keep records of those you help. Track support provided and measure your community impact.",
    category: "People",
  },
  {
    icon: GraduationCap,
    title: "Classes & Activities",
    description: "Manage classes, courses, and activities. Handle registrations and attendance tracking.",
    category: "Community",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Customisable dashboard with 7 widgets. Track donations, campaigns, events, and more at a glance.",
    category: "Insights",
  },
  {
    icon: Mail,
    title: "Email Campaigns",
    description: "Build beautiful emails with our drag-and-drop builder. Send newsletters and automated thank-yous.",
    category: "Communications",
  },
  {
    icon: BookOpen,
    title: "Sermon & Media Library",
    description: "Store and share sermons, videos, and resources. AI-powered search helps members find content.",
    category: "Content",
  },
  {
    icon: Sparkles,
    title: "AI Chatbot",
    description: "Your organisation's personal AI assistant. Answers donor questions and helps with fundraising advice.",
    category: "AI",
  },
];

const categoryColors: Record<string, string> = {
  "Core": "bg-primary/10 dark:bg-primary/20 text-primary border-primary/20",
  "Donations": "bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/20",
  "Events": "bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/20",
  "People": "bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/20",
  "Community": "bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/20",
  "Insights": "bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border-cyan-500/20",
  "Communications": "bg-pink-500/10 dark:bg-pink-500/20 text-pink-700 dark:text-pink-400 border-pink-500/20",
  "Content": "bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
  "AI": "bg-violet-500/10 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400 border-violet-500/20",
};

export function ModulesShowcase() {
  const [_, setLocation] = useLocation();

  return (
    <section id="modules" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="px-4 py-1.5">
            <ToggleRight className="w-3.5 h-3.5 mr-1.5" />
            Modular Marketplace
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Only Use What You Need
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Start with the essentials for free. As your organisation grows, switch on additional 
            modules from our marketplace. Turn them off when you don't need them.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {modules.map((module, index) => (
            <Card 
              key={index} 
              className="hover-elevate transition-all group cursor-pointer"
              onClick={() => module.link && setLocation(module.link)}
              data-testid={`module-card-${index}`}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <module.icon className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="outline" className={`text-xs shrink-0 ${categoryColors[module.category] || ""}`}>
                    {module.category}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {module.title}
                    {module.link && (
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {module.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            All modules work seamlessly together and can be activated instantly
          </p>
          <Button 
            size="lg"
            onClick={() => setLocation("/register")}
            data-testid="button-start-free"
          >
            Start Free Today
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
