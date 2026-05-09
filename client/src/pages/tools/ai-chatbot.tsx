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
  Bot, 
  ArrowRight, 
  CheckCircle2, 
  Play,
  MessageSquare,
  Zap,
  Clock,
  Brain,
  Shield,
  Globe,
  Settings,
  Heart
} from "lucide-react";

const benefits = [
  {
    icon: MessageSquare,
    title: "Instant Answers",
    description: "Answer donor questions 24/7. Your AI assistant knows about your organisation, events, and how to give.",
  },
  {
    icon: Brain,
    title: "Learns Your Organisation",
    description: "Train the AI with your content - FAQs, policies, event details, and giving options. It becomes your expert.",
  },
  {
    icon: Zap,
    title: "Fundraising Advice",
    description: "Get AI-powered suggestions to improve campaigns, craft appeals, and optimise your fundraising strategy.",
  },
  {
    icon: Clock,
    title: "24/7 Availability",
    description: "Never miss a question. The AI assistant is always available to help donors and answer enquiries.",
  },
  {
    icon: Heart,
    title: "Donation Guidance",
    description: "Help donors find the right giving option. Guide them through campaigns, recurring gifts, or event tickets.",
  },
  {
    icon: Shield,
    title: "Safe & Appropriate",
    description: "AI stays on topic and provides appropriate responses. Escalates sensitive matters to your team.",
  },
  {
    icon: Globe,
    title: "Public Page Integration",
    description: "Embed the chatbot on your public landing page. Engage visitors and convert them to supporters.",
  },
  {
    icon: Settings,
    title: "Easy Customisation",
    description: "Set the tone, personality, and knowledge base. Make it sound like your organisation, not a generic bot.",
  },
];

const faqs = [
  {
    question: "What can the AI chatbot answer?",
    answer: "It can answer questions about your organisation, events, campaigns, giving options, service times, and any other information you train it with. It helps donors find what they're looking for quickly.",
  },
  {
    question: "How do I train it with my organisation's information?",
    answer: "Simply add your FAQs, about page content, event details, and giving information. The AI learns from this content and uses it to answer questions accurately.",
  },
  {
    question: "Can it help with fundraising strategy?",
    answer: "Yes! Ask it for advice on improving your campaigns, writing appeal copy, or optimising your giving page. It draws on best practices to give helpful suggestions.",
  },
  {
    question: "Is it available on my public landing page?",
    answer: "Yes! Embed the chat widget on your public page. Visitors can ask questions and get instant answers, even outside office hours.",
  },
  {
    question: "What happens with difficult questions?",
    answer: "The AI knows its limits. For sensitive topics or complex issues, it offers to connect the person with your team via email or suggests they call directly.",
  },
  {
    question: "Can I customise how it responds?",
    answer: "Absolutely! Set the tone (formal, friendly, warm), add custom greetings, and control what topics it can discuss. Make it sound authentically like your organisation.",
  },
  {
    question: "Does it work in multiple languages?",
    answer: "Yes! The AI can respond in many languages, helping you serve a diverse community. It detects the language used and responds appropriately.",
  },
  {
    question: "Is AI Chatbot included in the free plan?",
    answer: "AI Chatbot is available as a marketplace module. Basic chat features are included free, with advanced AI and customisation on premium plans.",
  },
];

export default function AIChatbotPage() {
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
                  <Bot className="w-3.5 h-3.5 mr-1.5" />
                  Plegit Tool
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight" data-testid="text-hero-title">
                  AI Chatbot
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                  Your organisation's personal AI assistant. Answers donor questions instantly 
                  and helps with fundraising advice - available 24/7.
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
                  <span>24/7 availability</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span>Learns your org</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span>Fundraising advice</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="rounded-2xl border border-border/50 bg-card shadow-2xl shadow-primary/5 overflow-hidden">
                <div className="p-4 border-b flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Hope Church Assistant</p>
                    <p className="text-xs text-green-600">Online now</p>
                  </div>
                </div>
                
                <div className="p-4 space-y-4 min-h-[280px]">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 max-w-[80%]">
                      <p className="text-sm">Hi! I'm here to help. What would you like to know about Hope Church?</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 justify-end">
                    <div className="p-3 rounded-lg bg-primary text-primary-foreground max-w-[80%]">
                      <p className="text-sm">How can I donate to the building fund?</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 max-w-[80%]">
                      <p className="text-sm">Great question! You can donate to our Building Fund campaign in several ways:</p>
                      <ul className="text-sm mt-2 space-y-1 text-muted-foreground">
                        <li>• Online via our giving page</li>
                        <li>• By scanning a QR code at church</li>
                        <li>• Setting up a recurring gift</li>
                      </ul>
                      <p className="text-sm mt-2">Would you like me to take you to the donation page?</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs">Yes, please</Button>
                    <Button size="sm" variant="outline" className="text-xs">Tell me more</Button>
                  </div>
                </div>
                
                <div className="p-3 border-t">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Type a message...</span>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 p-3 rounded-lg border border-border/50 bg-card shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">Powered by GPT-5</p>
                    <p className="text-xs text-muted-foreground">Smart responses</p>
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
              See AI Chatbot in Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Watch how the AI assistant helps donors and provides fundraising advice
            </p>
          </div>
          
          <div className="relative rounded-2xl border border-border/50 bg-card shadow-xl overflow-hidden aspect-video">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto hover-elevate cursor-pointer group">
                  <Play className="w-10 h-10 text-primary ml-1 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-lg font-medium">AI Chatbot Demo</p>
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
              Everything You Need for Smart Assistance
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful AI features that help you engage with donors around the clock
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
              Everything you need to know about AI Chatbot
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border/50 rounded-lg px-6 bg-card/50 data-[state=open]:bg-card"
                data-testid={`ai-faq-item-${index}`}
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
            Ready to Add Your AI Assistant?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join hundreds of organisations already using Plegit's AI to help donors. 
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
