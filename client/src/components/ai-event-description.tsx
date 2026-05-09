import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Wand2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface AIEventDescriptionProps {
  eventTitle: string;
  eventType?: string;
  location?: string;
  date?: string;
  onDescriptionGenerated: (description: string) => void;
}

const toneOptions = [
  { value: "inspirational", label: "Inspirational", description: "Uplifting and motivating" },
  { value: "formal", label: "Formal", description: "Professional and structured" },
  { value: "casual", label: "Casual", description: "Friendly and approachable" },
  { value: "urgent", label: "Urgent", description: "Time-sensitive and compelling" },
];

export function AIEventDescription({ eventTitle, eventType, location, date, onDescriptionGenerated }: AIEventDescriptionProps) {
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState("inspirational");
  const [generatedDescription, setGeneratedDescription] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/events/generate-description", {
        title: eventTitle,
        eventType,
        location,
        date,
        tone,
      });
      return await res.text();
    },
    onSuccess: (description) => {
      setGeneratedDescription(description);
      setShowPreview(true);
      toast({
        title: "Description Generated!",
        description: "Review your AI-generated event description below.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate description. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApply = () => {
    onDescriptionGenerated(generatedDescription);
    setOpen(false);
    setShowPreview(false);
    setGeneratedDescription("");
    toast({
      title: "Description Applied",
      description: "Your event description has been updated.",
    });
  };

  const handleCancel = () => {
    setShowPreview(false);
    setGeneratedDescription("");
  };

  return (
    <>
      <Button 
        type="button" 
        variant="outline" 
        size="sm" 
        onClick={() => setOpen(true)}
        disabled={!eventTitle}
        data-testid="button-ai-description"
      >
        <Wand2 className="h-4 w-4 mr-2" />
        AI Generate
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Event Description Generator</DialogTitle>
            <DialogDescription>
              Generate a compelling event description using AI
            </DialogDescription>
          </DialogHeader>

          {!showPreview ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger data-testid="select-tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {toneOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="w-full"
                data-testid="button-generate"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Description
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <Badge variant="outline" className="bg-primary/10">
                      AI Generated
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        data-testid="button-cancel"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleApply}
                        data-testid="button-apply"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Apply
                      </Button>
                    </div>
                  </div>
                  <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap" data-testid="text-generated-description">
                    {generatedDescription}
                  </div>
                </CardContent>
              </Card>

              <Button
                variant="outline"
                onClick={() => {
                  setShowPreview(false);
                  generateMutation.mutate();
                }}
                disabled={generateMutation.isPending}
                data-testid="button-regenerate"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Regenerate
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
