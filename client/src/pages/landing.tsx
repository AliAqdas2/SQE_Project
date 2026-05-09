import { PublicHeader } from "@/components/public-header";
import { ModulesShowcase } from "@/components/modules-showcase";
import { AIFeaturesSection } from "@/components/ai-features-section";
import { MobileFeaturesSection } from "@/components/mobile-features-section";
import { FAQSection } from "@/components/faq-section";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, ArrowRight, Sparkles, Play, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { AIAssistantChat } from "@/components/ai-assistant-chat";
import { useLocation } from "wouter";

export default function LandingPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);
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
                <Badge variant="secondary" className="px-4 py-1.5" data-testid="badge-platform">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  AI-Powered Platform
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight" data-testid="text-hero-title">
                  Your All-in-One Platform for Charity & Faith
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                  Everything you need to take your charity or faith-based organisation digital. 
                  Start small for free, get organised, and grow with our powerful marketplace modules.
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
                    const modulesSection = document.getElementById("modules");
                    if (modulesSection) {
                      modulesSection.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  data-testid="button-explore-modules"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Explore Modules
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span>Free to start</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span>Works on any device</span>
                </div>
              </div>
            </div>
            
            <div className="relative lg:pl-8">
              <a 
                href="https://vimeo.com/1141133877/b764433f08?share=copy&fl=sv&fe=ci" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-2xl shadow-primary/5 overflow-hidden aspect-video hover-elevate"
                data-testid="link-hero-video"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                      <Play className="w-8 h-8 text-primary ml-1" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">Watch how Plegit works</p>
                    <p className="text-xs text-muted-foreground">2 minute introduction</p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      <ModulesShowcase />
      <AIFeaturesSection />
      <MobileFeaturesSection />
      <FAQSection />
      
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Ready to Go Digital?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join hundreds of charities and faith-based organisations already using Plegit 
            to manage donations, engage donors, and grow their communities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8" 
              onClick={() => setLocation("/register")}
              data-testid="button-get-started-bottom"
            >
              Start Free Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8" 
              data-testid="button-schedule-demo"
            >
              Schedule a Demo
            </Button>
          </div>
        </div>
      </section>

      <Footer />

      {isChatOpen && (
        <div className="fixed bottom-4 right-4 z-50">
          <AIAssistantChat onClose={() => setIsChatOpen(false)} />
        </div>
      )}

      {!isChatOpen && (
        <Button
          size="icon"
          className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg"
          onClick={() => setIsChatOpen(true)}
          data-testid="button-open-chat"
        >
          <Bot className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
