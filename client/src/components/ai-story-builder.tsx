import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Wand2, Loader2, Check, X, Sparkles } from "lucide-react";

interface AIStoryBuilderProps {
  campaignId: string;
  currentDescription: string;
  onDescriptionUpdated: (newDescription: string) => void;
}

const narrativeStyles = [
  { value: "emotional", label: "Emotional", description: "Touch hearts with compelling storytelling and empathy" },
  { value: "factual", label: "Factual", description: "Focus on data, metrics, and concrete outcomes" },
  { value: "testimonial", label: "Testimonial", description: "Share stories and voices of beneficiaries" },
  { value: "urgent", label: "Urgent", description: "Emphasize critical timing and immediate needs" },
  { value: "inspirational", label: "Inspirational", description: "Celebrate hope, transformation, and positive change" },
];

export function AIStoryBuilder({ campaignId, currentDescription, onDescriptionUpdated }: AIStoryBuilderProps) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState("emotional");
  const [additionalContext, setAdditionalContext] = useState("");
  const [generatedStory, setGeneratedStory] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/campaigns/${campaignId}/regenerate-story`, {
        style,
        additionalContext,
      });
      return await res.text();
    },
    onSuccess: (description) => {
      setGeneratedStory(description);
      setShowPreview(true);
      toast({
        title: "Story Generated!",
        description: "Review your new campaign narrative below.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate story. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApply = () => {
    onDescriptionUpdated(generatedStory);
    setOpen(false);
    setShowPreview(false);
    setGeneratedStory("");
    setAdditionalContext("");
    toast({
      title: "Story Applied",
      description: "Your campaign description has been updated. Don't forget to save your changes.",
    });
  };

  const handleCancel = () => {
    setShowPreview(false);
    setGeneratedStory("");
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-2"
        data-testid="button-open-story-builder"
      >
        <Sparkles className="h-4 w-4" />
        AI Story Builder
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              AI Story Builder
            </DialogTitle>
            <DialogDescription>
              Generate a compelling campaign narrative with AI. Choose a style and provide context for best results.
            </DialogDescription>
          </DialogHeader>

          {!showPreview ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Narrative Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger data-testid="select-story-style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {narrativeStyles.map((s) => (
                      <SelectItem key={s.value} value={s.value} data-testid={`option-style-${s.value}`}>
                        <div>
                          <div className="font-medium">{s.label}</div>
                          <div className="text-xs text-muted-foreground">{s.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="context">Additional Context (Optional)</Label>
                <Textarea
                  id="context"
                  placeholder="Add any specific details, stories, or points you'd like highlighted in the narrative..."
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  rows={5}
                  data-testid="textarea-story-context"
                />
                <p className="text-xs text-muted-foreground">
                  Provide specific details like beneficiary stories, impact numbers, or unique aspects of your cause.
                </p>
              </div>

              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-sm">Current Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {currentDescription || "No description yet"}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Generated Story
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none" data-testid="text-generated-story">
                    {generatedStory.split('\n').map((paragraph, i) => (
                      <p key={i} className="mb-4 text-sm">{paragraph}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-sm">Original Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {currentDescription || "No description yet"}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            {!showPreview ? (
              <>
                <Button variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel-dialog">
                  Cancel
                </Button>
                <Button
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                  data-testid="button-generate-story"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Story
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleCancel} data-testid="button-cancel-story">
                  <X className="mr-2 h-4 w-4" />
                  Discard
                </Button>
                <Button
                  onClick={() => {
                    setShowPreview(false);
                    setGeneratedStory("");
                  }}
                  variant="outline"
                  data-testid="button-regenerate-story"
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button onClick={handleApply} data-testid="button-apply-story">
                  <Check className="mr-2 h-4 w-4" />
                  Apply Story
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
