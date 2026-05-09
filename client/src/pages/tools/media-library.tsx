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
  Video, 
  ArrowRight, 
  CheckCircle2, 
  Play,
  Search,
  Upload,
  Folder,
  Share2,
  Download,
  Sparkles,
  Globe,
  Lock
} from "lucide-react";

const benefits = [
  {
    icon: Upload,
    title: "Easy Uploads",
    description: "Upload sermons, videos, audio files, and documents. Supports YouTube, Vimeo, and direct file uploads.",
  },
  {
    icon: Search,
    title: "AI-Powered Search",
    description: "Find content instantly with smart search. Search by title, speaker, topic, scripture reference, or even spoken words.",
  },
  {
    icon: Folder,
    title: "Organised Collections",
    description: "Create playlists and collections for sermon series, topics, or events. Members find relevant content easily.",
  },
  {
    icon: Share2,
    title: "Easy Sharing",
    description: "Share individual items or playlists via link, email, or social media. Embed videos on your website.",
  },
  {
    icon: Globe,
    title: "Public or Private",
    description: "Choose what's public and what's members-only. Control access to sensitive or exclusive content.",
  },
  {
    icon: Sparkles,
    title: "Auto Transcriptions",
    description: "Automatically transcribe sermons and videos. Makes content searchable and accessible to everyone.",
  },
  {
    icon: Download,
    title: "Download Options",
    description: "Let members download audio or video for offline listening. Perfect for commutes or areas with poor signal.",
  },
  {
    icon: Lock,
    title: "Member Access Control",
    description: "Restrict premium content to members or donors. Create exclusive access tiers if needed.",
  },
];

const faqs = [
  {
    question: "What types of content can I upload?",
    answer: "Upload videos, audio files, PDFs, and documents. You can also embed content from YouTube, Vimeo, or other platforms by pasting the link.",
  },
  {
    question: "How does the AI-powered search work?",
    answer: "Our AI transcribes your content and makes it searchable. Members can search by title, speaker, topic, scripture, or even words spoken in the video. It's like Google for your sermon archive.",
  },
  {
    question: "Can I organise content into series?",
    answer: "Yes! Create playlists for sermon series, topics, or any grouping. Members can browse collections or search across your entire library.",
  },
  {
    question: "Can members download content for offline use?",
    answer: "You can enable downloads for any content. Members can save audio or video to their devices for listening offline - perfect for commutes or travel.",
  },
  {
    question: "How do I control who sees what?",
    answer: "Set content as public or members-only. Create access tiers for premium content. Control visibility at the item or collection level.",
  },
  {
    question: "Can I embed videos on my website?",
    answer: "Yes! Every video gets an embed code. Paste it into your website, blog, or any platform that supports embedded content.",
  },
  {
    question: "Are transcriptions automatic?",
    answer: "Yes! Videos and audio are automatically transcribed after upload. Review and edit transcriptions if needed. This makes all content searchable and accessible.",
  },
  {
    question: "Is Sermon & Media Library included in the free plan?",
    answer: "Sermon & Media Library is available as a marketplace module. Basic storage is included free, with more storage and AI features on premium plans.",
  },
];

export default function MediaLibraryPage() {
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
                  <Video className="w-3.5 h-3.5 mr-1.5" />
                  Plegit Tool
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight" data-testid="text-hero-title">
                  Sermon & Media Library
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                  Store and share sermons, videos, and resources. AI-powered search helps 
                  members find exactly what they're looking for.
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
                  <span>AI-powered search</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span>Auto transcription</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                  <span>Offline downloads</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="rounded-2xl border border-border/50 bg-card shadow-2xl shadow-primary/5 overflow-hidden">
                <div className="p-4 border-b">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Search sermons, topics, speakers...</span>
                  </div>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Recent Sermons</p>
                    
                    <div className="flex gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 hover-elevate cursor-pointer">
                      <div className="w-20 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Play className="w-6 h-6 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">Walking by Faith</p>
                        <p className="text-xs text-muted-foreground">Pastor John • Nov 24</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">42 min</Badge>
                          <span className="text-[10px] text-muted-foreground">1.2k views</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 p-3 rounded-lg bg-muted/50 hover-elevate cursor-pointer">
                      <div className="w-20 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Play className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">The Power of Prayer</p>
                        <p className="text-xs text-muted-foreground">Pastor Mary • Nov 17</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">38 min</Badge>
                          <span className="text-[10px] text-muted-foreground">987 views</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="p-2 rounded-lg bg-muted/50 text-center" data-testid="stat-sermons">
                      <p className="text-lg font-bold text-foreground" data-testid="text-stat-value-247">247</p>
                      <p className="text-xs text-muted-foreground">Sermons</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50 text-center" data-testid="stat-series">
                      <p className="text-lg font-bold text-foreground" data-testid="text-stat-value-12">12</p>
                      <p className="text-xs text-muted-foreground">Series</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50 text-center" data-testid="stat-total-views">
                      <p className="text-lg font-bold text-foreground" data-testid="text-stat-value-45k">45k</p>
                      <p className="text-xs text-muted-foreground">Total Views</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 p-3 rounded-lg border border-border/50 bg-card shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">AI Transcribed</p>
                    <p className="text-xs text-muted-foreground">Searchable content</p>
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
              See Sermon & Media Library in Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Watch how easy it is to upload, organise, and share your content
            </p>
          </div>
          
          <div className="relative rounded-2xl border border-border/50 bg-card shadow-xl overflow-hidden aspect-video">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto hover-elevate cursor-pointer group">
                  <Play className="w-10 h-10 text-primary ml-1 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-lg font-medium">Media Library Demo</p>
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
              Everything You Need to Share Your Content
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features that help your community access and engage with your content
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
              Everything you need to know about Sermon & Media Library
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border/50 rounded-lg px-6 bg-card/50 data-[state=open]:bg-card"
                data-testid={`media-faq-item-${index}`}
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
            Ready to Build Your Media Library?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join hundreds of organisations already using Plegit to share their content. 
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
