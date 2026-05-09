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
  QrCode, 
  ArrowRight, 
  CheckCircle2, 
  Play,
  Smartphone,
  Printer,
  Zap,
  Globe,
  CreditCard,
  BarChart3,
  Download,
  Palette
} from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Instant Giving",
    description: "Donors scan, tap, and give in seconds. No app download required. Works with any smartphone camera.",
  },
  {
    icon: Printer,
    title: "Print Anywhere",
    description: "Generate QR codes for posters, collection boxes, event materials, or display screens. Unlimited prints included.",
  },
  {
    icon: Globe,
    title: "Multi-Currency Support",
    description: "Donors give in their preferred currency. QR codes work for supporters anywhere in the world.",
  },
  {
    icon: CreditCard,
    title: "Multiple Payment Methods",
    description: "Accept cards, Apple Pay, Google Pay, and bank transfers. Whatever's easiest for your donors.",
  },
  {
    icon: BarChart3,
    title: "Track Performance",
    description: "See which QR codes get scanned most. Understand where donations come from and optimise placement.",
  },
  {
    icon: Palette,
    title: "Custom Branding",
    description: "Add your logo to QR codes. Match your organisation's colours for a professional look.",
  },
  {
    icon: Smartphone,
    title: "Mobile-Optimised Pages",
    description: "Donation pages load instantly on any device. Designed for quick, frictionless giving on the go.",
  },
  {
    icon: Download,
    title: "Easy Download",
    description: "Download QR codes in any format - PNG, SVG, PDF. Ready for print or digital display.",
  },
];

const faqs = [
  {
    question: "How do QR code donations work?",
    answer: "Donors simply scan the QR code with their smartphone camera. It opens a mobile-optimised donation page where they can give in seconds. No app needed - it just works.",
  },
  {
    question: "Where can I use QR codes?",
    answer: "Anywhere! Print them on posters, flyers, collection boxes, event badges, receipts, newsletters, or display on screens. Each scan is tracked so you know what's working.",
  },
  {
    question: "Can I create different QR codes for different campaigns?",
    answer: "Absolutely! Create unique QR codes for each campaign, event, or location. This helps you track where donations come from and which placements work best.",
  },
  {
    question: "What payment methods can donors use?",
    answer: "Donors can pay with credit cards, debit cards, Apple Pay, Google Pay, and bank transfers. The page automatically shows payment options available in their location.",
  },
  {
    question: "Can I add my logo to the QR code?",
    answer: "Yes! Upload your organisation's logo and it appears in the centre of the QR code. You can also customise colours to match your branding.",
  },
  {
    question: "Do QR codes work internationally?",
    answer: "Yes! Donors can scan from anywhere in the world and give in their local currency. You receive funds in your currency with automatic conversion.",
  },
  {
    question: "How do I track QR code performance?",
    answer: "Your dashboard shows scans, conversions, and donation amounts for each QR code. See which locations and placements drive the most giving.",
  },
  {
    question: "Is QR Donations included in the free plan?",
    answer: "QR Donations is available as a marketplace module. Basic QR codes are included free, with advanced analytics and custom branding on premium plans.",
  },
];

export default function QRDonationsPage() {
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
                  <QrCode className="w-3.5 h-3.5 mr-1.5" />
                  Plegit Tool
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
                  QR Donations
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                  Let supporters give instantly with a simple scan. Print QR codes anywhere and 
                  turn any surface into a giving opportunity.
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
                  <span>Scan & give in seconds</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span>No app required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span>Track every scan</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="rounded-2xl border border-border/50 bg-card shadow-2xl shadow-primary/5 overflow-hidden p-8">
                <div className="text-center space-y-6">
                  <p className="text-sm font-medium text-muted-foreground">Scan to Donate</p>
                  
                  <div className="mx-auto w-48 h-48 bg-white rounded-2xl p-4 shadow-lg">
                    <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PHBhdGggZD0iTTEgMWg3djdIMXptMiAydjNoM1Yzem0xMi0yaDd2N2gtN3ptMiAydjNoM1Yzek0xIDEzaDd2N0gxem0yIDJ2M2gzdi0zem0xMC0yaDN2MmgtMnYtMWgtMXptMCAzaDFoMXYxaC0xdjFoMXYxaC0ydi0xaC0xdi0xaDF6bTIgMHYxaDJ2MWgtMXYxaDFoMXYtMmgtMXYtMWgtMXoiIGZpbGw9ImN1cnJlbnRDb2xvciIvPjwvc3ZnPg==')] bg-contain flex items-center justify-center">
                      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-primary-foreground text-xs font-bold">P</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="font-semibold">Hope Community Church</p>
                    <p className="text-sm text-muted-foreground">Building Fund Campaign</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-xl font-bold text-foreground">847</p>
                      <p className="text-xs text-muted-foreground">Scans</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-foreground">312</p>
                      <p className="text-xs text-muted-foreground">Donations</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-foreground">37%</p>
                      <p className="text-xs text-muted-foreground">Conversion</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 p-3 rounded-lg border border-border/50 bg-card shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">Works on any phone</p>
                    <p className="text-xs text-muted-foreground">No app needed</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-4 -right-4 p-3 rounded-lg border border-border/50 bg-card shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">£45 just now</p>
                    <p className="text-xs text-muted-foreground">From lobby poster</p>
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
              See QR Donations in Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Watch how easy it is to create QR codes and collect donations instantly
            </p>
          </div>
          
          <div className="relative rounded-2xl border border-border/50 bg-card shadow-xl overflow-hidden aspect-video">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto hover-elevate cursor-pointer group">
                  <Play className="w-10 h-10 text-primary ml-1 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-lg font-medium">QR Donations Demo</p>
                <p className="text-sm text-muted-foreground">Click to play video (2 minutes)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Everything You Need for Instant Giving
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features that make giving as easy as pointing a camera
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
              Everything you need to know about QR Donations
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border/50 rounded-lg px-6 bg-card/50 data-[state=open]:bg-card"
                data-testid={`qr-faq-item-${index}`}
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
            Ready to Make Giving Instant?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join hundreds of organisations already using Plegit for frictionless donations. 
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
