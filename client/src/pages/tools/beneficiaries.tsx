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
  HeartHandshake, 
  ArrowRight, 
  CheckCircle2, 
  Play,
  FileText,
  Users,
  TrendingUp,
  Shield,
  Calendar,
  Tag,
  BarChart3,
  MessageSquare
} from "lucide-react";

const benefits = [
  {
    icon: Users,
    title: "Beneficiary Profiles",
    description: "Create detailed profiles for those you serve. Track demographics, needs, and support history in one secure place.",
  },
  {
    icon: FileText,
    title: "Support Records",
    description: "Log every interaction, service, and resource provided. Build a complete picture of how you're helping each person.",
  },
  {
    icon: TrendingUp,
    title: "Impact Measurement",
    description: "Track outcomes and measure your community impact. Generate reports showing the difference your organisation makes.",
  },
  {
    icon: Tag,
    title: "Case Management",
    description: "Assign case workers, set follow-up dates, and track progress. Never let anyone fall through the cracks.",
  },
  {
    icon: Shield,
    title: "Privacy & Compliance",
    description: "Role-based access controls protect sensitive information. Meet data protection requirements with confidence.",
  },
  {
    icon: Calendar,
    title: "Appointment Scheduling",
    description: "Book appointments and send reminders. Track attendance and reschedule with ease.",
  },
  {
    icon: BarChart3,
    title: "Reporting & Analytics",
    description: "Generate reports for funders, boards, and stakeholders. Show your impact with clear data and visualisations.",
  },
  {
    icon: MessageSquare,
    title: "Notes & Communication",
    description: "Add private notes to profiles. Share relevant information with team members securely.",
  },
];

const faqs = [
  {
    question: "What information can I store about beneficiaries?",
    answer: "Create custom fields for any information you need - demographics, needs assessments, services received, outcomes, and more. All data is stored securely and encrypted.",
  },
  {
    question: "How do I track the support we provide?",
    answer: "Log each interaction, service, or resource provided against a beneficiary's profile. See their complete support history in one timeline view.",
  },
  {
    question: "Can I measure our community impact?",
    answer: "Yes! Track outcomes and generate impact reports. Show funders and stakeholders exactly how many people you've helped and what difference you've made.",
  },
  {
    question: "How do I protect sensitive information?",
    answer: "Role-based access controls let you decide who sees what. Some staff may see full profiles while others only see limited information. All data is encrypted.",
  },
  {
    question: "Can I assign case workers to beneficiaries?",
    answer: "Yes! Assign primary and secondary case workers, set follow-up dates, and track case progress. Get alerts when follow-ups are due.",
  },
  {
    question: "How do I generate reports for funders?",
    answer: "Use our report builder to create custom reports. Show demographics, services provided, outcomes achieved, and more. Export in PDF or Excel format.",
  },
  {
    question: "Can multiple team members access the same records?",
    answer: "Yes! Team members can collaborate on cases with shared notes and updates. Activity logs show who made changes and when.",
  },
  {
    question: "Is Beneficiary Tracking included in the free plan?",
    answer: "Beneficiary Tracking is available as a marketplace module. Basic features are included free, with advanced case management on premium plans.",
  },
];

export default function BeneficiaryTrackingPage() {
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
                <Badge variant="secondary" className="px-4 py-1.5" data-testid="badge-tool-category">
                  <HeartHandshake className="w-3.5 h-3.5 mr-1.5" />
                  Plegit Tool
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight" data-testid="text-hero-title">
                  Beneficiary Tracking
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                  Keep records of those you help. Track support provided and measure your 
                  community impact with powerful yet simple tools.
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
                  <span>Impact measurement</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span>Case management</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span>GDPR compliant</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="rounded-2xl border border-border/50 bg-card shadow-2xl shadow-primary/5 overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="font-semibold">Beneficiary Profile</h3>
                  <Badge className="bg-blue-600/20 text-blue-700 dark:text-blue-400 border-0">Active Case</Badge>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xl font-bold text-primary">MK</span>
                    </div>
                    <div>
                      <p className="font-semibold">Maria K.</p>
                      <p className="text-sm text-muted-foreground">Case ID: BEN-2024-0847</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50" data-testid="stat-support-sessions">
                      <p className="text-xs text-muted-foreground">Support Sessions</p>
                      <p className="text-lg font-bold text-foreground" data-testid="text-stat-value-12">12</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50" data-testid="stat-months-active">
                      <p className="text-xs text-muted-foreground">Months Active</p>
                      <p className="text-lg font-bold text-foreground" data-testid="text-stat-value-6">6</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Recent Support</p>
                    
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Food Parcel Provided</p>
                          <p className="text-xs text-muted-foreground">Yesterday at 2:30 PM</p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Housing Advice Session</p>
                          <p className="text-xs text-muted-foreground">3 days ago</p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2">
                    <Badge variant="outline" className="text-xs">Food Support</Badge>
                    <Badge variant="outline" className="text-xs">Housing</Badge>
                    <Badge variant="outline" className="text-xs">Family</Badge>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 p-3 rounded-lg border border-border/50 bg-card shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">Positive outcome</p>
                    <p className="text-xs text-muted-foreground">Housing secured</p>
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
              See Beneficiary Tracking in Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Watch how easy it is to track support, manage cases, and measure your impact
            </p>
          </div>
          
          <div className="relative rounded-2xl border border-border/50 bg-card shadow-xl overflow-hidden aspect-video">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto hover-elevate cursor-pointer group">
                  <Play className="w-10 h-10 text-primary ml-1 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-lg font-medium">Beneficiary Tracking Demo</p>
                <p className="text-sm text-muted-foreground">Click to play video (4 minutes)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Everything You Need to Track Your Impact
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features that help you support your community effectively
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
              Everything you need to know about Beneficiary Tracking
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border/50 rounded-lg px-6 bg-card/50 data-[state=open]:bg-card"
                data-testid={`beneficiary-faq-item-${index}`}
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
            Ready to Measure Your Community Impact?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join hundreds of organisations already using Plegit to track and improve their support. 
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
