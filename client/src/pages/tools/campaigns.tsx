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
  Target, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  BarChart3, 
  Users, 
  Share2,
  Play,
  Palette,
  Globe,
  TrendingUp,
  Heart,
  Mail
} from "lucide-react";

const benefits = [
  {
    icon: Sparkles,
    title: "AI-Powered Campaign Creation",
    description: "Describe your cause in plain English and let AI write compelling campaign descriptions, set realistic goals, and suggest effective strategies.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Progress Tracking",
    description: "Watch your thermometer fill up in real-time. Track donations, donor count, and progress towards your goal with beautiful visual dashboards.",
  },
  {
    icon: Users,
    title: "Peer-to-Peer Fundraising",
    description: "Let supporters create their own fundraising pages for your cause. Track individual performance with leaderboards and milestone celebrations.",
  },
  {
    icon: Share2,
    title: "Easy Social Sharing",
    description: "One-click sharing to Facebook, Twitter, WhatsApp, and email. Campaign pages are optimised for beautiful social media previews.",
  },
  {
    icon: Palette,
    title: "Customisable Campaign Pages",
    description: "Build stunning campaign pages with our drag-and-drop builder. Add images, videos, progress bars, and donor walls.",
  },
  {
    icon: Globe,
    title: "Multi-Currency Support",
    description: "Accept donations in multiple currencies. Supporters can give in their local currency while you receive funds in yours.",
  },
  {
    icon: TrendingUp,
    title: "Campaign Analytics",
    description: "Understand what's working with detailed analytics. Track traffic sources, conversion rates, and donor behaviour.",
  },
  {
    icon: Mail,
    title: "Automated Thank-Yous",
    description: "Send personalised thank-you emails automatically. Customise messages for different donation levels and recurring donors.",
  },
];

const faqs = [
  {
    question: "How quickly can I create a campaign?",
    answer: "With our AI assistant, you can have a fully configured campaign live in under 5 minutes. Just describe what you're fundraising for, and the AI handles the rest - including writing compelling copy and suggesting a realistic goal.",
  },
  {
    question: "Can I have multiple campaigns running at once?",
    answer: "Absolutely! There's no limit to the number of campaigns you can run. Many organisations have seasonal campaigns, emergency appeals, and ongoing fundraisers all running simultaneously.",
  },
  {
    question: "How does peer-to-peer fundraising work?",
    answer: "Your supporters can create their own fundraising pages linked to your main campaign. They share with their network, and all donations roll up to your campaign total. It's like having an army of fundraisers working for you.",
  },
  {
    question: "What payment methods can donors use?",
    answer: "Donors can pay with credit cards, debit cards, Apple Pay, Google Pay, and bank transfers in supported countries. All payments are processed securely through Stripe.",
  },
  {
    question: "Can I customise the look of my campaign page?",
    answer: "Yes! You can add your organisation's logo, choose colours, upload images and videos, and arrange content blocks however you like. Campaign pages can also be white-labelled on premium plans.",
  },
  {
    question: "How do I track campaign performance?",
    answer: "Your dashboard shows real-time donation totals, donor counts, average donation amounts, and conversion rates. You can also see which sharing methods bring in the most donations.",
  },
  {
    question: "What happens when a campaign ends?",
    answer: "You choose what happens - the page can stay live for reference, redirect to a new campaign, or display a thank-you message. All donor data and analytics are preserved.",
  },
  {
    question: "Is Campaign Management included in the free plan?",
    answer: "Yes! Campaign Management is a core feature available on all plans, including free. Premium plans add features like white-labelling, advanced analytics, and priority support.",
  },
];

export default function CampaignManagementPage() {
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
                  <Target className="w-3.5 h-3.5 mr-1.5" />
                  Plegit Tool
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
                  Campaign Management
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                  Create beautiful fundraising campaigns in minutes. Set goals, track progress, 
                  and engage donors with AI-powered tools designed for charities and faith-based organisations.
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
                  <span>Unlimited campaigns</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span>AI-powered content</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span>Real-time analytics</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="rounded-2xl border border-border/50 bg-card shadow-2xl shadow-primary/5 overflow-hidden">
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Heart className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Community Kitchen Project</p>
                        <p className="text-sm text-muted-foreground">Active Campaign</p>
                      </div>
                    </div>
                    <Badge className="bg-green-600 dark:bg-green-700 text-white border-0">Live</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">$24,500 of $30,000</span>
                    </div>
                    <div className="h-4 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-[82%] bg-gradient-to-r from-primary to-primary/70 rounded-full" />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>82% funded</span>
                      <span>14 days left</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-foreground">287</p>
                      <p className="text-xs text-muted-foreground">Donors</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-foreground">$85</p>
                      <p className="text-xs text-muted-foreground">Avg Gift</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-foreground">12</p>
                      <p className="text-xs text-muted-foreground">Fundraisers</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 p-3 rounded-lg border border-border/50 bg-card shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">+$1,250 today</p>
                    <p className="text-xs text-muted-foreground">23 donations</p>
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
              See Campaign Management in Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Watch how easy it is to create, launch, and manage successful fundraising campaigns
            </p>
          </div>
          
          <div className="relative rounded-2xl border border-border/50 bg-card shadow-xl overflow-hidden aspect-video">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto hover-elevate cursor-pointer group">
                  <Play className="w-10 h-10 text-primary ml-1 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-lg font-medium">Campaign Management Demo</p>
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
              Everything You Need to Fundraise Successfully
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features that make campaign management a breeze
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
              Everything you need to know about Campaign Management
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border/50 rounded-lg px-6 bg-card/50 data-[state=open]:bg-card"
                data-testid={`campaign-faq-item-${index}`}
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
            Ready to Start Your First Campaign?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join hundreds of charities already using Plegit to reach their fundraising goals. 
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
