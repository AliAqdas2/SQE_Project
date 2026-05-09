import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CampaignProgressProps {
  raised: number;
  goal: number;
  currency?: string;
  donorCount?: number;
  daysLeft?: number;
  variant?: "default" | "compact" | "thermometer";
}

export function CampaignProgress({
  raised,
  goal,
  currency = "USD",
  donorCount,
  daysLeft,
  variant = "default",
}: CampaignProgressProps) {
  const percentage = Math.min((raised / goal) * 100, 100);
  const remaining = Math.max(goal - raised, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (variant === "compact") {
    return (
      <div className="space-y-2">
        <Progress value={percentage} className="h-2" data-testid="progress-bar" />
        <div className="flex justify-between text-sm">
          <span className="font-semibold" data-testid="text-raised">
            {formatCurrency(raised)}
          </span>
          <span className="text-muted-foreground" data-testid="text-goal">
            {formatCurrency(goal)}
          </span>
        </div>
      </div>
    );
  }

  if (variant === "thermometer") {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-6">
            {/* Thermometer visual */}
            <div className="flex flex-col items-center">
              <div className="relative w-8 h-64 bg-muted rounded-full overflow-hidden">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary to-primary/70 transition-all duration-500"
                  style={{ height: `${percentage}%` }}
                  data-testid="thermometer-fill"
                />
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-primary rounded-full border-4 border-background" />
              </div>
              <div className="mt-2 text-center">
                <div className="text-2xl font-bold text-primary" data-testid="text-percentage">
                  {Math.round(percentage)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  Funded
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="text-3xl font-bold" data-testid="text-raised-amount">
                  {formatCurrency(raised)}
                </div>
                <div className="text-sm text-muted-foreground">
                  raised of {formatCurrency(goal)} goal
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {donorCount !== undefined && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-semibold" data-testid="text-donor-count">
                        {donorCount.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Donors
                      </div>
                    </div>
                  </div>
                )}

                {daysLeft !== undefined && daysLeft > 0 && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-semibold" data-testid="text-days-left">
                        {daysLeft}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Days left
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {remaining > 0 && (
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {formatCurrency(remaining)} to go
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-bold" data-testid="text-raised-amount">
                {formatCurrency(raised)}
              </div>
              <div className="text-sm text-muted-foreground">
                raised of {formatCurrency(goal)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary" data-testid="text-percentage">
                {Math.round(percentage)}%
              </div>
              <div className="text-xs text-muted-foreground">
                Complete
              </div>
            </div>
          </div>

          <Progress value={percentage} className="h-3" data-testid="progress-bar" />
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          {donorCount !== undefined && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-semibold" data-testid="text-donor-count">
                  {donorCount.toLocaleString()}
                </span>
                <span className="text-muted-foreground"> donors</span>
              </span>
            </div>
          )}

          {daysLeft !== undefined && daysLeft > 0 && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-semibold" data-testid="text-days-left">
                  {daysLeft}
                </span>
                <span className="text-muted-foreground"> days left</span>
              </span>
            </div>
          )}

          {remaining > 0 && !daysLeft && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {formatCurrency(remaining)} to go
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
