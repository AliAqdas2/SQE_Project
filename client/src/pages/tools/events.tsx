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
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  Play,
  Ticket,
  QrCode,
  Users,
  Globe,
  CreditCard,
  Mail,
  MapPin,
  Clock
} from "lucide-react";

const benefits = [
  {
    icon: Ticket,
    title: "Flexible Ticketing",
    description: "Create multiple ticket types - early bird, VIP, group discounts, and more. Set capacity limits and manage waitlists automatically.",
  },
  {
    icon: QrCode,
    title: "QR Code Check-In",
    description: "Scan attendees in with their phone. No paper tickets needed. See real-time attendance and get alerts for VIPs.",
  },
  {
    icon: Globe,
    title: "Multi-Currency Pricing",
    description: "Sell tickets in any currency. Attendees pay in their local currency while you receive funds in yours.",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "Accept cards, Apple Pay, Google Pay, and bank transfers. All payments processed securely through Stripe.",
  },
  {
    icon: Users,
    title: "Attendee Management",
    description: "View and manage all registrations in one place. Send updates, handle refunds, and track dietary requirements.",
  },
  {
    icon: Mail,
    title: "Automated Emails",
    description: "Send confirmation emails, reminders, and follow-ups automatically. Customise every message to match your brand.",
  },
  {
    icon: MapPin,
    title: "Venue & Speaker Management",
    description: "Add venue details with maps, manage speaker profiles, and create detailed event agendas.",
  },
  {
    icon: Clock,
    title: "Recurring Events",
    description: "Set up weekly services, monthly meetings, or annual conferences. Manage series with individual session controls.",
  },
];

const faqs = [
  {
    question: "What types of events can I create?",
    answer: "Any type! Charity galas, community dinners, workshops, conferences, weekly services, fundraising walks - if people need to register, we've got you covered.",
  },
  {
    question: "How does QR code check-in work?",
    answer: "Each ticket has a unique QR code. At the event, use any smartphone to scan codes and check people in instantly. Works offline too - syncs when you're back online.",
  },
  {
    question: "Can I offer different ticket prices?",
    answer: "Absolutely! Create as many ticket types as you need - early bird, standard, VIP, group rates, child/adult, member discounts. Each can have its own price and capacity.",
  },
  {
    question: "What payment methods can attendees use?",
    answer: "Credit cards, debit cards, Apple Pay, Google Pay, and bank transfers in supported countries. All payments are secure and PCI compliant.",
  },
  {
    question: "Can I manage speakers and sponsors?",
    answer: "Yes! Add speaker profiles with photos and bios, manage sponsor logos and links, and create detailed agendas with session descriptions.",
  },
  {
    question: "How do I handle dietary requirements?",
    answer: "Add custom questions to your registration form. Collect dietary needs, accessibility requirements, or any other information. View all responses in a handy report.",
  },
  {
    question: "Can I set up recurring events?",
    answer: "Yes! Perfect for weekly services, monthly meetings, or regular classes. Create the series once, then manage individual sessions as needed.",
  },
  {
    question: "Is Event Ticketing included in the free plan?",
    answer: "Event Ticketing is available as a marketplace module. Free plans can use basic event features, with advanced features available on premium plans.",
  },
];

export default function EventTicketingPage() {
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
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  Plegit Tool
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
                  Event Ticketing
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                  Create stunning event pages, sell tickets in any currency, and check in attendees 
                  with QR codes. Everything you need to run successful events.
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
                  <span>QR check-in</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span>Multi-currency</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span>Automated emails</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="rounded-2xl border border-border/50 bg-card shadow-2xl shadow-primary/5 overflow-hidden">
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-green-600 dark:bg-green-700 text-white border-0">On Sale</Badge>
                    <span className="text-sm text-muted-foreground">Dec 15, 2024</span>
                  </div>
                  
                  <h3 className="text-xl font-bold">Annual Charity Gala</h3>
                  <p className="text-sm text-muted-foreground">Join us for an evening of celebration and giving</p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>Grand Hotel</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>7:00 PM</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">Standard Ticket</p>
                        <p className="text-xs text-muted-foreground">Includes dinner & entertainment</p>
                      </div>
                      <p className="font-bold">£75</p>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div>
                        <p className="font-medium">VIP Table (8 seats)</p>
                        <p className="text-xs text-muted-foreground">Premium seating & champagne</p>
                      </div>
                      <p className="font-bold">£800</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">156</p>
                      <p className="text-xs text-muted-foreground">Registered</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">44</p>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">£11.7k</p>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 p-3 rounded-lg border border-border/50 bg-card shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <QrCode className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">QR Check-in Ready</p>
                    <p className="text-xs text-muted-foreground">Scan to admit</p>
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
              See Event Ticketing in Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Watch how easy it is to create events, sell tickets, and manage check-ins
            </p>
          </div>
          
          <div className="relative rounded-2xl border border-border/50 bg-card shadow-xl overflow-hidden aspect-video">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto hover-elevate cursor-pointer group">
                  <Play className="w-10 h-10 text-primary ml-1 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-lg font-medium">Event Ticketing Demo</p>
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
              Everything You Need to Run Successful Events
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features that make event management a breeze
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
              Everything you need to know about Event Ticketing
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border/50 rounded-lg px-6 bg-card/50 data-[state=open]:bg-card"
                data-testid={`event-faq-item-${index}`}
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
            Ready to Create Your First Event?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join hundreds of organisations already using Plegit to run successful events. 
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
