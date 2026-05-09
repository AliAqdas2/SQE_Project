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
  Radio, 
  ArrowRight, 
  CheckCircle2, 
  Play,
  Heart,
  MessageSquare,
  Share2,
  Coins,
  Eye,
  Bell,
  Tv,
  Zap
} from "lucide-react";

const benefits = [
  {
    icon: Coins,
    title: "Real-Time Donations",
    description: "Accept donations during your livestream with on-screen alerts. Donors see their names appear instantly, encouraging more giving.",
  },
  {
    icon: MessageSquare,
    title: "Live Prayer Requests",
    description: "Viewers can submit prayer requests during the stream. Respond in real-time and build deeper community connections.",
  },
  {
    icon: Tv,
    title: "Multi-Platform Streaming",
    description: "Stream to YouTube, Facebook, and your Plegit page simultaneously. Reach your audience wherever they are.",
  },
  {
    icon: Bell,
    title: "Donation Alerts",
    description: "Beautiful on-screen notifications when donations come in. Customise the look and sound to match your brand.",
  },
  {
    icon: Eye,
    title: "Viewer Analytics",
    description: "See who's watching, when they tune in, and how long they stay. Understand your audience and grow engagement.",
  },
  {
    icon: Share2,
    title: "Easy Sharing",
    description: "One-click sharing to social media. Viewers can invite friends to join the stream and donate together.",
  },
  {
    icon: Heart,
    title: "Giving Goals",
    description: "Set fundraising goals and watch the thermometer fill up live. Create excitement and urgency around your appeal.",
  },
  {
    icon: Zap,
    title: "Instant Replays",
    description: "Streams are automatically saved for replay. Late viewers can still donate and engage with the content.",
  },
];

const faqs = [
  {
    question: "What platforms can I stream to?",
    answer: "You can stream to YouTube Live, Facebook Live, and your Plegit donation page simultaneously. Use your existing streaming software like OBS, Streamlabs, or StreamYard.",
  },
  {
    question: "How do donation alerts work?",
    answer: "When someone donates during your stream, a beautiful on-screen notification appears with their name and message. You can customise colours, sounds, and display duration.",
  },
  {
    question: "Can viewers submit prayer requests?",
    answer: "Yes! Viewers can submit prayer requests during the stream. You'll see them in a moderated queue and can choose which ones to share or respond to live.",
  },
  {
    question: "Do I need special equipment to livestream?",
    answer: "Just a computer or smartphone with a camera. For better quality, you can use a webcam, microphone, and streaming software like OBS. We have guides to help you get started.",
  },
  {
    question: "Can people donate if they miss the live stream?",
    answer: "Absolutely! Streams are automatically saved for replay. Viewers can still donate and the giving thermometer shows cumulative totals from live and replay views.",
  },
  {
    question: "How do I set up a giving goal?",
    answer: "Set your target amount when creating the livestream. A thermometer appears on-screen that fills up as donations come in. You can update the goal during the stream if needed.",
  },
  {
    question: "Can I stream weekly services?",
    answer: "Yes! Set up recurring livestreams for weekly services, monthly events, or regular programming. Each stream gets its own donation page and analytics.",
  },
  {
    question: "Is Livestream Giving included in the free plan?",
    answer: "Livestream Giving is available as a marketplace module. Try it free for 14 days, then upgrade to continue using advanced features.",
  },
];

export default function LivestreamGivingPage() {
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
                  <Radio className="w-3.5 h-3.5 mr-1.5" />
                  Plegit Tool
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
                  Livestream Giving
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                  Accept donations during your livestreams with real-time alerts. 
                  Engage viewers, celebrate givers, and raise more for your cause.
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
                  <span>Real-time alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span>Multi-platform</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span>Prayer requests</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="rounded-2xl border border-border/50 bg-card shadow-2xl shadow-primary/5 overflow-hidden">
                <div className="bg-muted/50 aspect-video flex items-center justify-center relative">
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-red-600 text-white border-0 animate-pulse">
                      <span className="w-2 h-2 bg-white rounded-full mr-2"></span>
                      LIVE
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    <span>1,247 watching</span>
                  </div>
                  <Play className="w-16 h-16 text-primary/50" />
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Giving Goal</span>
                      <span className="font-semibold">£8,750 of £10,000</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-[87%] bg-gradient-to-r from-primary to-primary/70 rounded-full" />
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">James D. just donated £50!</p>
                        <p className="text-xs text-muted-foreground">"God bless this ministry"</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">£8,750</p>
                      <p className="text-xs text-muted-foreground">Raised</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">142</p>
                      <p className="text-xs text-muted-foreground">Donors</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">23</p>
                      <p className="text-xs text-muted-foreground">Prayers</p>
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
                    <p className="text-xs font-medium">+£250 in last 5 min</p>
                    <p className="text-xs text-muted-foreground">Trending up!</p>
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
              See Livestream Giving in Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Watch how easy it is to engage viewers and collect donations during your livestreams
            </p>
          </div>
          
          <div className="relative rounded-2xl border border-border/50 bg-card shadow-xl overflow-hidden aspect-video">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto hover-elevate cursor-pointer group">
                  <Play className="w-10 h-10 text-primary ml-1 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-lg font-medium">Livestream Giving Demo</p>
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
              Everything You Need to Fundraise Live
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features that turn viewers into supporters
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
              Everything you need to know about Livestream Giving
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border/50 rounded-lg px-6 bg-card/50 data-[state=open]:bg-card"
                data-testid={`livestream-faq-item-${index}`}
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
            Ready to Engage Your Audience Live?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join hundreds of organisations already using Plegit to fundraise during livestreams. 
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
