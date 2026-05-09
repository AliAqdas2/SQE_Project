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
  UserCheck, 
  ArrowRight, 
  CheckCircle2, 
  Play,
  Clock,
  Calendar,
  Award,
  Mail,
  MapPin,
  ClipboardList,
  BarChart3,
  Heart
} from "lucide-react";

const benefits = [
  {
    icon: ClipboardList,
    title: "Volunteer Sign-Up",
    description: "Create opportunities and let volunteers sign up online. Manage availability, skills, and preferences all in one place.",
  },
  {
    icon: Clock,
    title: "Hours Tracking",
    description: "Volunteers log their hours easily. Generate reports for recognition programs, grants, or compliance requirements.",
  },
  {
    icon: Calendar,
    title: "Schedule Management",
    description: "Build schedules, assign shifts, and send reminders automatically. Handle swaps and time-off requests effortlessly.",
  },
  {
    icon: Mail,
    title: "Communication Hub",
    description: "Send updates to all volunteers or specific teams. Keep everyone informed about events, changes, and appreciation.",
  },
  {
    icon: Award,
    title: "Recognition & Milestones",
    description: "Celebrate volunteer achievements automatically. Track milestones and send certificates when hours targets are reached.",
  },
  {
    icon: MapPin,
    title: "Location Management",
    description: "Assign volunteers to different sites or events. See who's available where and when at a glance.",
  },
  {
    icon: BarChart3,
    title: "Impact Reports",
    description: "Generate reports showing volunteer hours, participation rates, and community impact. Perfect for stakeholders and funders.",
  },
  {
    icon: Heart,
    title: "Volunteer Profiles",
    description: "Store skills, certifications, emergency contacts, and preferences. Match the right volunteers to the right opportunities.",
  },
];

const faqs = [
  {
    question: "How do volunteers sign up for opportunities?",
    answer: "Share a link to your volunteer portal where they can browse opportunities, check schedules, and sign up for shifts that match their availability and skills.",
  },
  {
    question: "Can volunteers log their own hours?",
    answer: "Yes! Volunteers can log hours from their phone or computer. You can also enable manager approval if you need oversight before hours are recorded.",
  },
  {
    question: "How do I create a volunteer schedule?",
    answer: "Use our visual scheduler to create shifts and assign volunteers. Set up recurring schedules for regular programs. Volunteers receive reminders automatically.",
  },
  {
    question: "Can I track different volunteer roles?",
    answer: "Absolutely! Create custom roles with different requirements and permissions. Track hours separately for different programs or departments.",
  },
  {
    question: "How do I recognise volunteer achievements?",
    answer: "Set up milestone alerts for hours targets. The system can automatically send certificates, thank-you emails, or notify you to plan recognition events.",
  },
  {
    question: "Can volunteers swap shifts with each other?",
    answer: "Yes! Volunteers can request swaps through the portal. You can approve automatically or require manager approval based on your preferences.",
  },
  {
    question: "Does it work for multiple locations?",
    answer: "Yes! Manage volunteers across multiple sites, events, or programs. Filter and report by location to understand participation across your organisation.",
  },
  {
    question: "Is Volunteer Management included in the free plan?",
    answer: "Volunteer Management is available as a marketplace module. Basic features are included free, with advanced scheduling and reporting on premium plans.",
  },
];

export default function VolunteerManagementPage() {
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
                  <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                  Plegit Tool
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight" data-testid="text-hero-title">
                  Volunteer Management
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                  Coordinate volunteers, track hours, and manage schedules with ease. 
                  Perfect for community outreach and building your volunteer army.
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
                  <span>Hours tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span>Shift scheduling</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span>Auto reminders</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="rounded-2xl border border-border/50 bg-card shadow-2xl shadow-primary/5 overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="font-semibold">Volunteer Dashboard</h3>
                  <Badge variant="outline">This Week</Badge>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50 text-center" data-testid="stat-active-volunteers">
                      <p className="text-2xl font-bold text-foreground" data-testid="text-stat-value-47">47</p>
                      <p className="text-xs text-muted-foreground">Active Volunteers</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center" data-testid="stat-hours-this-week">
                      <p className="text-2xl font-bold text-foreground" data-testid="text-stat-value-156">156</p>
                      <p className="text-xs text-muted-foreground">Hours This Week</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center" data-testid="stat-shifts-filled">
                      <p className="text-2xl font-bold text-foreground" data-testid="text-stat-value-12">12</p>
                      <p className="text-xs text-muted-foreground">Shifts Filled</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Upcoming Shifts</p>
                    
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">JM</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">Jane Mitchell</p>
                            <p className="text-xs text-muted-foreground">Food Bank - Morning</p>
                          </div>
                        </div>
                        <Badge className="bg-green-600/20 text-green-700 dark:text-green-400 border-0">Confirmed</Badge>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-sm font-bold text-muted-foreground">TS</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">Tom Smith</p>
                            <p className="text-xs text-muted-foreground">Youth Club - Evening</p>
                          </div>
                        </div>
                        <Badge variant="outline">Pending</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 p-3 rounded-lg border border-border/50 bg-card shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Award className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">Milestone reached!</p>
                    <p className="text-xs text-muted-foreground">Sarah hit 100 hours</p>
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
              See Volunteer Management in Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Watch how easy it is to coordinate volunteers, track hours, and manage schedules
            </p>
          </div>
          
          <div className="relative rounded-2xl border border-border/50 bg-card shadow-xl overflow-hidden aspect-video">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto hover-elevate cursor-pointer group">
                  <Play className="w-10 h-10 text-primary ml-1 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-lg font-medium">Volunteer Management Demo</p>
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
              Everything You Need to Manage Volunteers
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features that help you build and coordinate your volunteer community
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
              Everything you need to know about Volunteer Management
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border/50 rounded-lg px-6 bg-card/50 data-[state=open]:bg-card"
                data-testid={`volunteer-faq-item-${index}`}
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
            Ready to Empower Your Volunteers?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join hundreds of organisations already using Plegit to coordinate their volunteer programs. 
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
