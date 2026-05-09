import { PublicHeader } from "@/components/public-header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLocation } from "wouter";
import { 
  BarChart3, 
  ArrowRight, 
  CheckCircle2, 
  Play,
  TrendingUp,
  PieChart,
  Calendar,
  Users,
  Target,
  Download,
  Layout,
  Sparkles
} from "lucide-react";

const benefits = [
  {
    icon: Layout,
    title: "Customisable Dashboard",
    description: "Choose which widgets to display. Drag and drop to arrange your perfect dashboard. Save different views for different needs.",
  },
  {
    icon: TrendingUp,
    title: "Donation Trends",
    description: "See giving patterns over time. Identify peak giving periods, track growth, and spot opportunities to increase donations.",
  },
  {
    icon: PieChart,
    title: "Campaign Performance",
    description: "Compare campaigns side by side. See which appeals resonate, which channels work, and where to focus your efforts.",
  },
  {
    icon: Users,
    title: "Donor Insights",
    description: "Understand your donor base. See demographics, giving frequency, retention rates, and identify your major donors.",
  },
  {
    icon: Target,
    title: "Goal Tracking",
    description: "Set targets and track progress in real-time. Get alerts when you're ahead or behind, and celebrate milestones.",
  },
  {
    icon: Calendar,
    title: "Date Range Filters",
    description: "View data for any time period. Compare this month to last, this year to previous, or set custom date ranges.",
  },
  {
    icon: Download,
    title: "Export Reports",
    description: "Download reports in Excel, PDF, or CSV. Share with your board, create presentations, or analyse offline.",
  },
  {
    icon: Sparkles,
    title: "AI Insights",
    description: "Get smart recommendations based on your data. Discover patterns and opportunities you might have missed.",
  },
];

const faqs = [
  {
    question: "What metrics can I track?",
    answer: "Track donations, donor counts, average gift size, retention rates, campaign performance, channel effectiveness, and much more. Choose from 7 customisable widgets to build your perfect dashboard.",
  },
  {
    question: "Can I customise my dashboard?",
    answer: "Absolutely! Toggle widgets on and off, rearrange their positions, and save your preferences. Your dashboard remembers your settings between sessions.",
  },
  {
    question: "How far back can I see historical data?",
    answer: "All your historical data is preserved from day one. Filter by any date range - yesterday, last week, last year, or custom periods. Compare time periods to spot trends.",
  },
  {
    question: "Can I export reports for my board?",
    answer: "Yes! Export any report or the full dashboard in Excel, PDF, or CSV format. Perfect for board meetings, grant applications, or internal reviews.",
  },
  {
    question: "Does it show data from all modules?",
    answer: "Yes! The analytics dashboard pulls data from campaigns, events, livestreams, donations, and donors. Get a complete picture of your organisation's performance.",
  },
  {
    question: "Can multiple team members use the dashboard?",
    answer: "Yes! Each team member can customise their own dashboard view. Share access based on roles - some may see everything, others just their campaigns.",
  },
  {
    question: "Are there AI-powered insights?",
    answer: "Yes! Our AI analyses your data and surfaces insights you might miss. Get recommendations for improving donation rates, reaching goals, and engaging donors.",
  },
  {
    question: "Is Analytics Dashboard included in the free plan?",
    answer: "Basic analytics are included on all plans. Premium plans unlock advanced widgets, AI insights, custom reports, and unlimited data export.",
  },
];

export default function AnalyticsDashboardPage() {
  const [_, setLocation] = useLocation();

  return (
    <div className="min-h-screen">
      <PublicHeader />
      
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-40 h-40 bg-primary/8 rounded-full blur-2xl" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="px-4 py-1.5">
                  <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                  Plegit Tool
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
                  Analytics Dashboard
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                  Understand your fundraising performance at a glance. Track donations, donors, 
                  campaigns, and events with a customisable dashboard designed for charities.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  onClick={() => setLocation("/register")}
                  data-testid="button-start-free-hero"
                >
                  Start Free Today
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => {
                    const demoSection = document.getElementById("video-demo");
                    if (demoSection) {
                      demoSection.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  data-testid="button-watch-demo"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Watch Demo
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span>7 customisable widgets</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span>Real-time data</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span>Export reports</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="rounded-2xl border border-border/50 bg-card shadow-2xl shadow-primary/5 overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="font-semibold">Fundraising Overview</h3>
                  <Badge variant="outline">Last 30 days</Badge>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Total Raised</span>
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold">£47,250</p>
                      <p className="text-xs text-green-600">+12% vs last month</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Donors</span>
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-2xl font-bold">312</p>
                      <p className="text-xs text-muted-foreground">87 new this month</p>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground">Campaign Performance</span>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Building Fund</span>
                          <span className="font-medium">£24,500</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full w-[82%] bg-primary rounded-full" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Youth Program</span>
                          <span className="font-medium">£12,750</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full w-[64%] bg-primary rounded-full" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>General Fund</span>
                          <span className="font-medium">£10,000</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full w-[100%] bg-green-600 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">£151</p>
                      <p className="text-xs text-muted-foreground">Avg Gift</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">78%</p>
                      <p className="text-xs text-muted-foreground">Retention</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">4.2</p>
                      <p className="text-xs text-muted-foreground">Gifts/Donor</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 p-3 rounded-lg border border-border/50 bg-card shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">AI Insight</p>
                    <p className="text-xs text-muted-foreground">Tuesdays = best giving</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="video-demo" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <Badge variant="outline" className="px-4 py-1.5">
              <Play className="w-3.5 h-3.5 mr-1.5" />
              Video Demo
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">
              See the Analytics Dashboard in Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Watch how easy it is to track your fundraising performance and gain insights
            </p>
          </div>
          
          <div className="relative rounded-2xl border border-border/50 bg-card shadow-xl overflow-hidden aspect-video">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto hover-elevate cursor-pointer group">
                  <Play className="w-10 h-10 text-primary ml-1 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-lg font-medium">Analytics Dashboard Demo</p>
                <p className="text-sm text-muted-foreground">Click to play video (3 minutes)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Everything You Need to Understand Your Impact
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features that turn data into actionable insights
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="hover-elevate" data-testid={`benefit-card-${index}`}>
                <CardContent className="p-6 space-y-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about the Analytics Dashboard
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border/50 rounded-lg px-6 bg-card/50 data-[state=open]:bg-card"
                data-testid={`analytics-faq-item-${index}`}
              >
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  <span className="font-medium">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Ready to Understand Your Fundraising?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join hundreds of organisations already using Plegit to track their impact. 
            Get started in minutes - no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8"
              onClick={() => setLocation("/register")}
              data-testid="button-start-free-bottom"
            >
              Start Free Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8"
              onClick={() => setLocation("/")}
              data-testid="button-explore-more"
            >
              Explore More Tools
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
