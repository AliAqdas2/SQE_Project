import { Badge } from "@/components/ui/badge";
import { Sparkles, Wand2, MessageCircle, Target, Lightbulb } from "lucide-react";

const aiFeatures = [
  {
    icon: Wand2,
    title: "AI-Generated Campaigns",
    description: "Describe your cause in a few words, and our AI creates compelling campaign descriptions, goals, and strategies.",
  },
  {
    icon: Target,
    title: "Smart Fundraising Tips",
    description: "Get personalised advice on how to reach your fundraising goals based on your organisation's data and best practices.",
  },
  {
    icon: MessageCircle,
    title: "24/7 AI Assistant",
    description: "Built-in chatbot answers donor questions, helps staff with tasks, and provides instant guidance on platform features.",
  },
  {
    icon: Lightbulb,
    title: "Content Suggestions",
    description: "Generate thank-you messages, event descriptions, and email content that resonates with your community.",
  },
];

export function AIFeaturesSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="px-4 py-1.5">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Powered by AI
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold">
                AI Does the Heavy Lifting
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Don't know where to start? Our AI assistant guides you every step of the way. 
                From setting up campaigns to writing compelling content, artificial intelligence 
                makes fundraising accessible to everyone.
              </p>
            </div>

            <div className="grid gap-6">
              {aiFeatures.map((feature, index) => (
                <div 
                  key={index} 
                  className="flex gap-4 p-4 rounded-lg hover-elevate"
                  data-testid={`ai-feature-${index}`}
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-xl overflow-hidden">
              <div className="p-6 border-b border-border/50 bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">AI Assistant</p>
                    <p className="text-xs text-muted-foreground">Always here to help</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium">You</span>
                  </div>
                  <div className="bg-muted rounded-lg rounded-tl-none p-3 text-sm max-w-[80%]">
                    How can I raise more funds for our building project?
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-primary/10 dark:bg-primary/20 rounded-lg rounded-tl-none p-3 text-sm max-w-[80%] space-y-2">
                    <p>Great question! Here are some proven strategies:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Set up a peer-to-peer fundraising campaign</li>
                      <li>Create a progress thermometer on your page</li>
                      <li>Send monthly update emails to donors</li>
                      <li>Host a virtual fundraising event</li>
                    </ul>
                    <p className="text-muted-foreground">Would you like me to help you set any of these up?</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
