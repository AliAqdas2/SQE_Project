import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Loader2, Target, Check, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";

interface GoalOptimizerProps {
  campaignTitle: string;
  campaignDescription?: string;
  campaignCountry: string;
  campaignCategory?: string;
  onGoalSelected: (amount: number) => void;
}

interface GoalTier {
  amount: number;
  reasoning: string;
}

interface GoalSuggestions {
  conservative: GoalTier;
  moderate: GoalTier;
  ambitious: GoalTier;
  insights: string;
}

export function GoalOptimizer({
  campaignTitle,
  campaignDescription,
  campaignCountry,
  campaignCategory,
  onGoalSelected,
}: GoalOptimizerProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<GoalSuggestions | null>(null);
  const { toast } = useToast();
  const { formatCurrency } = useOrganizationLocale();

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/campaigns/optimize-goal", {
        title: campaignTitle,
        description: campaignDescription,
        country: campaignCountry,
        category: campaignCategory,
        organizationType: "Faith-based",
      });
      return await res.json();
    },
    onSuccess: (data: GoalSuggestions) => {
      setSuggestions(data);
      toast({
        title: "Goals Optimized!",
        description: "AI has analyzed your campaign and suggested optimal fundraising targets.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Optimization Failed",
        description: error.message || "Failed to optimize goals. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSelectGoal = (amount: number) => {
    onGoalSelected(amount);
    setOpen(false);
    setSuggestions(null);
    toast({
      title: "Goal Selected",
      description: `Your campaign goal has been set to ${amount.toLocaleString()}.`,
    });
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => {
          setOpen(true);
          if (!suggestions) {
            optimizeMutation.mutate();
          }
        }}
        className="gap-2"
        data-testid="button-open-goal-optimizer"
      >
        <Target className="h-4 w-4" />
        AI Goal Optimizer
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              AI Goal Optimizer
            </DialogTitle>
            <DialogDescription>
              Get AI-powered suggestions for your campaign fundraising goal based on historical data and campaign analysis.
            </DialogDescription>
          </DialogHeader>

          {optimizeMutation.isPending ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Analyzing campaign and optimizing goals...</p>
            </div>
          ) : suggestions ? (
            <div className="space-y-6">
              {/* Insights */}
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground" data-testid="text-goal-insights">
                    {suggestions.insights}
                  </p>
                </CardContent>
              </Card>

              {/* Goal Tiers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Conservative */}
                <Card className="hover-elevate cursor-pointer" onClick={() => handleSelectGoal(suggestions.conservative.amount)} data-testid="card-goal-conservative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">
                        Conservative
                      </Badge>
                      <Check className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-2xl mt-2" data-testid="text-goal-conservative">
                      {formatCurrency(suggestions.conservative.amount)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{suggestions.conservative.reasoning}</p>
                  </CardContent>
                </Card>

                {/* Moderate */}
                <Card className="hover-elevate cursor-pointer border-primary" onClick={() => handleSelectGoal(suggestions.moderate.amount)} data-testid="card-goal-moderate">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-primary">
                        Recommended
                      </Badge>
                      <Check className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-2xl mt-2" data-testid="text-goal-moderate">
                      {formatCurrency(suggestions.moderate.amount)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{suggestions.moderate.reasoning}</p>
                  </CardContent>
                </Card>

                {/* Ambitious */}
                <Card className="hover-elevate cursor-pointer" onClick={() => handleSelectGoal(suggestions.ambitious.amount)} data-testid="card-goal-ambitious">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-700 dark:text-orange-400">
                        Ambitious
                      </Badge>
                      <Check className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-2xl mt-2" data-testid="text-goal-ambitious">
                      {formatCurrency(suggestions.ambitious.amount)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{suggestions.ambitious.reasoning}</p>
                  </CardContent>
                </Card>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Click any goal card to select it for your campaign
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Target className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Click "Optimize Goals" to get AI-powered suggestions</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); setSuggestions(null); }} data-testid="button-cancel-optimizer">
              Close
            </Button>
            {suggestions && (
              <Button onClick={() => optimizeMutation.mutate()} variant="outline" data-testid="button-regenerate-goals">
                <TrendingUp className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
