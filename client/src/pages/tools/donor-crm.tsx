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
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Play,
  Heart,
  Mail,
  Tag,
  Search,
  FileText,
  TrendingUp,
  Gift,
  Clock
} from "lucide-react";

const benefits = [
  {
    icon: Heart,
    title: "Complete Donor Profiles",
    description: "Store all donor information in one place - contact details, giving history, communication preferences, and personal notes.",
  },
  {
    icon: TrendingUp,
    title: "Giving History Tracking",
    description: "See every donation at a glance. Track giving patterns, identify lapsed donors, and celebrate milestones automatically.",
  },
  {
    icon: Tag,
    title: "Smart Tagging & Segments",
    description: "Organise donors with custom tags and segments. Filter by giving level, campaign interest, or any custom criteria.",
  },
  {
    icon: Mail,
    title: "Communication History",
    description: "Track every email, thank-you note, and interaction. Never miss a follow-up or duplicate outreach again.",
  },
  {
    icon: Search,
    title: "Powerful Search & Filters",
    description: "Find any donor instantly. Search by name, email, donation amount, date range, or custom fields.",
  },
  {
    icon: Gift,
    title: "Gift Aid Management",
    description: "Track Gift Aid declarations automatically. Generate HMRC-ready reports and maximise your tax-efficient giving.",
  },
  {
    icon: FileText,
    title: "Donor Reports",
    description: "Generate giving statements, tax receipts, and custom reports. Export data in any format you need.",
  },
  {
    icon: Clock,
    title: "Recurring Donor Management",
    description: "Track and manage recurring givers. Get alerts for failed payments and celebrate giving anniversaries.",
  },
];

const faqs = [
  {
    question: "How do I import existing donor data?",
    answer: "You can import donors from CSV files, spreadsheets, or migrate from other platforms. Our import wizard maps your fields automatically and handles duplicates intelligently.",
  },
  {
    question: "Can I track donations from multiple campaigns?",
    answer: "Absolutely! Every donation is linked to its campaign, but you can view a donor's complete giving history across all campaigns in one unified timeline.",
  },
  {
    question: "How does Gift Aid tracking work?",
    answer: "When donors make Gift Aid eligible donations, the system automatically tracks declarations and generates HMRC-compliant reports. You can claim 25p for every £1 donated.",
  },
  {
    question: "Can I segment donors for targeted communication?",
    answer: "Yes! Create unlimited segments based on any criteria - giving amount, frequency, campaign interest, location, or custom tags. Use segments for personalised email campaigns.",
  },
  {
    question: "Is my donor data secure?",
    answer: "We take data security seriously. All data is encrypted at rest and in transit. We're GDPR compliant and you control exactly who in your team can access donor information.",
  },
  {
    question: "Can I generate tax receipts automatically?",
    answer: "Yes! The system can automatically send tax receipts after each donation, or generate annual giving statements. Customise the format and branding to match your organisation.",
  },
  {
    question: "How do I handle duplicate donors?",
    answer: "Our smart matching system identifies potential duplicates based on email, phone, or name. You can merge records with one click, keeping all giving history intact.",
  },
  {
    question: "Is Donor CRM included in the free plan?",
    answer: "Yes! Donor CRM is a core feature available on all plans. Premium plans add features like advanced reporting, custom fields, and API access.",
  },
];

export default function DonorCRMPage() {
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
                  <Users className="w-3.5 h-3.5 mr-1.5" />
                  Plegit Tool
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
                  Donor CRM
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                  Build lasting relationships with your supporters. Track every interaction, 
                  understand giving patterns, and nurture donors from first gift to lifelong champion.
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
                  <span>Unlimited donors</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span>Gift Aid tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span>GDPR compliant</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="rounded-2xl border border-border/50 bg-card shadow-2xl shadow-primary/5 overflow-hidden">
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <h3 className="font-semibold">Donor Profile</h3>
                    <Badge className="bg-primary/10 text-primary border-0">Major Donor</Badge>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">SJ</span>
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Sarah Johnson</p>
                      <p className="text-sm text-muted-foreground">Supporter since 2019</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-foreground">£12,450</p>
                      <p className="text-xs text-muted-foreground">Total Given</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold text-foreground">24</p>
                      <p className="text-xs text-muted-foreground">Donations</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">sarah.j@email.com</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Monthly Giver</Badge>
                      <Badge variant="outline" className="text-xs">Gift Aid</Badge>
                      <Badge variant="outline" className="text-xs">Volunteer</Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 p-3 rounded-lg border border-border/50 bg-card shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Gift className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">Last gift: £250</p>
                    <p className="text-xs text-muted-foreground">2 weeks ago</p>
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
              See Donor CRM in Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Watch how easy it is to manage donor relationships and track giving history
            </p>
          </div>
          
          <div className="relative rounded-2xl border border-border/50 bg-card shadow-xl overflow-hidden aspect-video">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto hover-elevate cursor-pointer group">
                  <Play className="w-10 h-10 text-primary ml-1 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-lg font-medium">Donor CRM Demo</p>
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
              Everything You Need to Manage Donor Relationships
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features that help you build lasting connections with supporters
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
              Everything you need to know about Donor CRM
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border/50 rounded-lg px-6 bg-card/50 data-[state=open]:bg-card"
                data-testid={`donor-faq-item-${index}`}
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
            Ready to Build Stronger Donor Relationships?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join hundreds of charities already using Plegit to nurture their supporters. 
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
