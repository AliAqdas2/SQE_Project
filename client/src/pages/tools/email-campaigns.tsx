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
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  Play,
  Palette,
  Users,
  BarChart3,
  Clock,
  Zap,
  FileText,
  Eye,
  MousePointer
} from "lucide-react";

const benefits = [
  {
    icon: Palette,
    title: "Drag-and-Drop Builder",
    description: "Create beautiful emails without coding. Drag images, text, buttons, and more to build professional newsletters in minutes.",
  },
  {
    icon: Users,
    title: "Smart Segmentation",
    description: "Send targeted emails to specific groups. Segment by donor level, event attendance, interests, or any custom criteria.",
  },
  {
    icon: Zap,
    title: "Automated Thank-Yous",
    description: "Send personalised thank-you emails automatically after donations. Include gift amounts, tax receipts, and heartfelt messages.",
  },
  {
    icon: Clock,
    title: "Scheduled Sending",
    description: "Schedule emails for the perfect time. Queue up newsletters in advance and reach people when they're most likely to engage.",
  },
  {
    icon: BarChart3,
    title: "Campaign Analytics",
    description: "Track opens, clicks, and conversions. See which emails perform best and optimise your communication strategy.",
  },
  {
    icon: FileText,
    title: "Template Library",
    description: "Start with professionally designed templates. Customise for appeals, newsletters, event invites, or thank-you notes.",
  },
  {
    icon: Eye,
    title: "Preview & Test",
    description: "See exactly how your email looks on desktop and mobile. Send test emails before launching to your full list.",
  },
  {
    icon: MousePointer,
    title: "Click Tracking",
    description: "Know which links get clicked. Understand what content resonates and what drives action from your audience.",
  },
];

const faqs = [
  {
    question: "How do I create an email campaign?",
    answer: "Use our drag-and-drop builder to create beautiful emails in minutes. Choose a template, customise the content, select your audience, and send. No coding or design skills needed.",
  },
  {
    question: "Can I send automated thank-you emails?",
    answer: "Yes! Set up automatic thank-you emails that trigger after donations. Personalise with donor names, gift amounts, and even include tax receipts automatically.",
  },
  {
    question: "How do I segment my email list?",
    answer: "Create segments based on any criteria - donor level, event attendance, giving history, tags, or custom fields. Send targeted messages to the right people at the right time.",
  },
  {
    question: "Can I schedule emails in advance?",
    answer: "Absolutely! Schedule emails for any date and time. Queue up your newsletter series or time important appeals to land when your audience is most engaged.",
  },
  {
    question: "What analytics are available?",
    answer: "Track open rates, click rates, unsubscribes, and bounces. See which links get clicked and compare performance across campaigns to optimise your strategy.",
  },
  {
    question: "Are there email templates included?",
    answer: "Yes! Choose from professionally designed templates for appeals, newsletters, event invitations, thank-you notes, and more. Customise colours and branding to match your organisation.",
  },
  {
    question: "Can I test emails before sending?",
    answer: "Of course! Preview how emails look on desktop and mobile. Send test emails to yourself or colleagues before launching to your full audience.",
  },
  {
    question: "Is Email Campaigns included in the free plan?",
    answer: "Email Campaigns is available as a marketplace module. Basic email features are included free, with advanced automation and analytics on premium plans.",
  },
];

export default function EmailCampaignsPage() {
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
                  <Mail className="w-3.5 h-3.5 mr-1.5" />
                  Plegit Tool
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight" data-testid="text-hero-title">
                  Email Campaigns
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                  Build beautiful emails with our drag-and-drop builder. Send newsletters, 
                  automated thank-yous, and targeted campaigns that inspire action.
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
                  <span>Drag-and-drop builder</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span>Auto thank-yous</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span>Campaign analytics</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="rounded-2xl border border-border/50 bg-card shadow-2xl shadow-primary/5 overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="font-semibold">Email Builder</h3>
                  <Badge className="bg-green-600/20 text-green-700 dark:text-green-400 border-0">Draft</Badge>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="rounded-lg border border-dashed border-border p-4 text-center bg-muted/30">
                    <div className="w-full h-20 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-sm text-primary font-medium">Your Logo Here</span>
                    </div>
                    <h4 className="font-bold text-lg mb-2">Your Monthly Newsletter</h4>
                    <p className="text-sm text-muted-foreground mb-4">Thank you for being part of our community...</p>
                    <Button size="sm" className="w-full">Donate Now</Button>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex-1 h-px bg-border" />
                    <span>Drag elements to customise</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2">
                    <div className="p-2 rounded-lg bg-muted/50 text-center hover-elevate cursor-pointer">
                      <FileText className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Text</span>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50 text-center hover-elevate cursor-pointer">
                      <Eye className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Image</span>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50 text-center hover-elevate cursor-pointer">
                      <MousePointer className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Button</span>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50 text-center hover-elevate cursor-pointer">
                      <Users className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Social</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="p-2 rounded-lg bg-muted/50 text-center" data-testid="stat-recipients">
                      <p className="text-lg font-bold text-foreground" data-testid="text-stat-value-1247">1,247</p>
                      <p className="text-xs text-muted-foreground">Recipients</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50 text-center" data-testid="stat-open-rate">
                      <p className="text-lg font-bold text-foreground" data-testid="text-stat-value-42">42%</p>
                      <p className="text-xs text-muted-foreground">Open Rate</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50 text-center" data-testid="stat-click-rate">
                      <p className="text-lg font-bold text-foreground" data-testid="text-stat-value-83">8.3%</p>
                      <p className="text-xs text-muted-foreground">Click Rate</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 p-3 rounded-lg border border-border/50 bg-card shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">Auto thank-you sent</p>
                    <p className="text-xs text-muted-foreground">To Sarah J. (£50)</p>
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
              See Email Campaigns in Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Watch how easy it is to create beautiful emails and engage your community
            </p>
          </div>
          
          <div className="relative rounded-2xl border border-border/50 bg-card shadow-xl overflow-hidden aspect-video">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto hover-elevate cursor-pointer group">
                  <Play className="w-10 h-10 text-primary ml-1 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-lg font-medium">Email Campaigns Demo</p>
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
              Everything You Need for Email Success
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features that help you communicate effectively with your community
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
              Everything you need to know about Email Campaigns
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border/50 rounded-lg px-6 bg-card/50 data-[state=open]:bg-card"
                data-testid={`email-faq-item-${index}`}
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
            Ready to Create Beautiful Emails?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join hundreds of organisations already using Plegit to communicate with their community. 
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
