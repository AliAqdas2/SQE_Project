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
  GraduationCap, 
  ArrowRight, 
  CheckCircle2, 
  Play,
  Calendar,
  Users,
  ClipboardCheck,
  Bell,
  CreditCard,
  Repeat,
  FileText,
  Clock
} from "lucide-react";

const benefits = [
  {
    icon: Calendar,
    title: "Class Scheduling",
    description: "Create classes, courses, and activities with flexible scheduling. Set up one-off sessions or recurring programmes with ease.",
  },
  {
    icon: Users,
    title: "Registration Management",
    description: "Let participants register online. Set capacity limits, manage waitlists, and collect any information you need.",
  },
  {
    icon: ClipboardCheck,
    title: "Attendance Tracking",
    description: "Take attendance with one click. Track participation over time and identify who's engaged or at risk of dropping off.",
  },
  {
    icon: Bell,
    title: "Automated Reminders",
    description: "Send class reminders automatically. Reduce no-shows with email and SMS notifications before each session.",
  },
  {
    icon: CreditCard,
    title: "Payment Collection",
    description: "Collect fees online during registration. Offer early bird pricing, discounts, or payment plans for longer courses.",
  },
  {
    icon: Repeat,
    title: "Recurring Sessions",
    description: "Set up weekly or monthly programmes. Manage term dates, holidays, and make-up classes without the hassle.",
  },
  {
    icon: FileText,
    title: "Certificates & Reports",
    description: "Generate completion certificates and attendance reports. Track progress across multiple sessions or terms.",
  },
  {
    icon: Clock,
    title: "Waitlist Management",
    description: "Automatically manage waitlists when classes fill up. Notify people when spots become available.",
  },
];

const faqs = [
  {
    question: "What types of activities can I manage?",
    answer: "Any type! Sunday school, youth groups, adult education, fitness classes, workshops, support groups, after-school programmes - if it has sessions and participants, we've got you covered.",
  },
  {
    question: "How do participants register for classes?",
    answer: "Share your registration page where participants can browse available classes, see schedules, and sign up. Collect any custom information you need during registration.",
  },
  {
    question: "Can I collect payments during registration?",
    answer: "Yes! Accept payments online during registration. Offer different pricing tiers, early bird discounts, or set up payment plans for longer courses.",
  },
  {
    question: "How does attendance tracking work?",
    answer: "Mark attendance with a simple checklist during each session. View attendance history for any participant or class. Get alerts for patterns like consistent absences.",
  },
  {
    question: "Can I set up recurring classes?",
    answer: "Absolutely! Create recurring sessions - weekly, fortnightly, or monthly. Manage term dates and easily handle holidays or cancellations.",
  },
  {
    question: "What happens when a class is full?",
    answer: "Set capacity limits and enable waitlists. When someone cancels, the next person on the waitlist is automatically notified that a spot is available.",
  },
  {
    question: "Can I generate completion certificates?",
    answer: "Yes! Create custom certificate templates and generate them automatically when participants complete a course or reach attendance milestones.",
  },
  {
    question: "Is Classes & Activities included in the free plan?",
    answer: "Classes & Activities is available as a marketplace module. Basic features are included free, with advanced scheduling and payment features on premium plans.",
  },
];

export default function ClassesActivitiesPage() {
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
                  <GraduationCap className="w-3.5 h-3.5 mr-1.5" />
                  Plegit Tool
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight" data-testid="text-hero-title">
                  Classes & Activities
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                  Manage classes, courses, and activities with ease. Handle registrations, 
                  track attendance, and keep your community engaged.
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
                  <span>Online registration</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span>Attendance tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span>Payment collection</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="rounded-2xl border border-border/50 bg-card shadow-2xl shadow-primary/5 overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="font-semibold">Weekly Schedule</h3>
                  <Badge variant="outline">This Week</Badge>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">Youth Bible Study</p>
                          <p className="text-xs text-muted-foreground">Wednesdays, 6:30 PM</p>
                        </div>
                        <Badge className="bg-green-600/20 text-green-700 dark:text-green-400 border-0">12/15</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          <div className="w-6 h-6 rounded-full bg-primary/30 border-2 border-card" />
                          <div className="w-6 h-6 rounded-full bg-primary/40 border-2 border-card" />
                          <div className="w-6 h-6 rounded-full bg-primary/50 border-2 border-card" />
                          <div className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center">
                            <span className="text-[10px] text-muted-foreground">+9</span>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">3 spots left</span>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">Choir Practice</p>
                          <p className="text-xs text-muted-foreground">Thursdays, 7:00 PM</p>
                        </div>
                        <Badge variant="outline">8/20</Badge>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">Kids Sunday School</p>
                          <p className="text-xs text-muted-foreground">Sundays, 10:00 AM</p>
                        </div>
                        <Badge variant="outline">24/30</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="p-2 rounded-lg bg-muted/50 text-center" data-testid="stat-classes">
                      <p className="text-lg font-bold text-foreground" data-testid="text-stat-value-5">5</p>
                      <p className="text-xs text-muted-foreground">Classes</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50 text-center" data-testid="stat-registered">
                      <p className="text-lg font-bold text-foreground" data-testid="text-stat-value-87">87</p>
                      <p className="text-xs text-muted-foreground">Registered</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50 text-center" data-testid="stat-attendance">
                      <p className="text-lg font-bold text-foreground" data-testid="text-stat-value-92">92%</p>
                      <p className="text-xs text-muted-foreground">Attendance</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 p-3 rounded-lg border border-border/50 bg-card shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">Reminder sent</p>
                    <p className="text-xs text-muted-foreground">12 people notified</p>
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
              See Classes & Activities in Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Watch how easy it is to manage classes, registrations, and attendance
            </p>
          </div>
          
          <div className="relative rounded-2xl border border-border/50 bg-card shadow-xl overflow-hidden aspect-video">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto hover-elevate cursor-pointer group">
                  <Play className="w-10 h-10 text-primary ml-1 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-lg font-medium">Classes & Activities Demo</p>
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
              Everything You Need to Manage Activities
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features that help you run engaging programmes for your community
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
              Everything you need to know about Classes & Activities
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border/50 rounded-lg px-6 bg-card/50 data-[state=open]:bg-card"
                data-testid={`classes-faq-item-${index}`}
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
            Ready to Organise Your Activities?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join hundreds of organisations already using Plegit to manage their classes and activities. 
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
