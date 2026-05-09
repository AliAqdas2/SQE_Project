import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { ArrowUp, ArrowDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: {
    value: number;
    trend: "up" | "down";
  };
  icon: LucideIcon;
}

export function StatCard({ title, value, change, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <p className="text-3xl font-bold" data-testid={`text-stat-${title}`}>
            {value}
          </p>
          {change && (
            <div className="flex items-center gap-1 text-sm">
              {change.trend === "up" ? (
                <ArrowUp className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDown className="h-4 w-4 text-red-600" />
              )}
              <span className={change.trend === "up" ? "text-green-600" : "text-red-600"}>
                {change.value}%
              </span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
