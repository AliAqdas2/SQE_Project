import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AIEventGeneratorProps {
  eventTitle: string;
  orgId: string;
  onContentGenerated: (data: { title: string; description: string; imageUrl: string }) => void;
}

export function AIEventGenerator({ eventTitle, orgId, onContentGenerated }: AIEventGeneratorProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedContent, setGeneratedContent] = useState<{
    title: string;
    description: string;
    imageUrl: string;
  } | null>(null);

  const generateMutation = useMutation({
    mutationFn: async (keywords: string) => {
      console.log("AI Generate: Starting request", { orgId, keywords });
      const response = await apiRequest(
        "POST", 
        `/api/org/${orgId}/events/ai-generate`, 
        { keywords }
      );
      const data: { title: string; description: string; imageUrl: string } = await response.json();
      console.log("AI Generate: Response received", data);
      return data;
    },
    onSuccess: (data) => {
      console.log("AI Generate: Success", data);
      setProgress(100);
      setGeneratedContent(data);
      toast({
        title: "Content Generated",
        description: "AI has created your event content. Review and apply if you like it.",
      });
    },
    onError: (error: any) => {
      console.error("AI Generate: Error", error);
      setProgress(0);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate content. Please try again.",
        variant: "destructive",
      });
      setIsOpen(false);
    },
  });

  const handleGenerate = () => {
    if (!eventTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter an event title first to use AI generation.",
        variant: "destructive",
      });
      return;
    }

    setIsOpen(true);
    setProgress(0);
    setGeneratedContent(null);
    generateMutation.mutate(eventTitle);
  };

  const handleApply = () => {
    if (generatedContent) {
      onContentGenerated(generatedContent);
      setIsOpen(false);
      setGeneratedContent(null);
      setProgress(0);
    }
  };

  const handleDiscard = () => {
    setIsOpen(false);
    setGeneratedContent(null);
    setProgress(0);
  };

  // Update progress during generation with staged progression
  useEffect(() => {
    if (generateMutation.isPending) {
      // Stage 1: Start generating text (0 → 33)
      setProgress(0);
      const timer1 = setTimeout(() => setProgress(33), 1000);
      
      // Stage 2: Generating image (33 → 66)
      const timer2 = setTimeout(() => setProgress(66), 3000);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [generateMutation.isPending]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleGenerate}
        disabled={!eventTitle.trim()}
        data-testid="button-ai-generate"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Generate with AI
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Event Generator</DialogTitle>
            <DialogDescription>
              {generateMutation.isPending
                ? "Creating your event content..."
                : generatedContent
                ? "Review the AI-generated content"
                : "Processing..."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {generateMutation.isPending && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">
                  {progress < 33 && "Generating title and description..."}
                  {progress >= 33 && progress < 66 && "Creating event image..."}
                  {progress >= 66 && progress < 100 && "Finalising…please be patient"}
                </p>
              </div>
            )}

            {generatedContent && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Title</h3>
                      <p className="text-sm">{generatedContent.title}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {generatedContent.description}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Banner Image</h3>
                      <img
                        src={generatedContent.imageUrl}
                        alt="Generated event banner"
                        className="w-full rounded-md border"
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={handleDiscard}
                    data-testid="button-discard"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Discard
                  </Button>
                  <Button
                    onClick={handleApply}
                    data-testid="button-apply"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Apply to Form
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
