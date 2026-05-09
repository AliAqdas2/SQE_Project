import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { WIDGET_REGISTRY } from "@/components/widgets/widget-registry";

interface AnalyticsCustomizationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enabledWidgets: string[];
  onToggleWidget: (widgetId: string) => void;
}

export function AnalyticsCustomizationPanel({
  open,
  onOpenChange,
  enabledWidgets,
  onToggleWidget,
}: AnalyticsCustomizationPanelProps) {
  const availableWidgets = Object.values(WIDGET_REGISTRY);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Analytics Widgets</SheetTitle>
          <SheetDescription>
            Choose which widgets to display on your analytics dashboard.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="space-y-3">
            {availableWidgets.map((widget) => {
              const isEnabled = enabledWidgets.includes(widget.id);
              const Icon = widget.icon;

              return (
                <div
                  key={widget.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm block truncate">{widget.title}</span>
                      <span className="text-xs text-muted-foreground block truncate">
                        {widget.description}
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => onToggleWidget(widget.id)}
                    data-testid={`switch-widget-${widget.id}`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t">
          <p className="text-sm text-muted-foreground text-center">
            Widgets help you visualize your organization's key metrics and performance data.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

