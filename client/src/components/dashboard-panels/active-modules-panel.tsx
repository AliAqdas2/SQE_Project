import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, ShoppingBag } from "lucide-react";
import { Link } from "wouter";

interface EnabledModule {
  id: string;
  orgId: string;
  moduleId: string;
  enabledAt: string;
  status: string;
  module: {
    id: string;
    moduleKey: string;
    title: string;
    description: string;
    isDefault: boolean;
  };
}

interface ActiveModulesPanelProps {
  orgId: string;
  enabledModules?: Array<{ module: { moduleKey: string } }>;
}

export function ActiveModulesPanel({ orgId }: ActiveModulesPanelProps) {
  const { data: enabledModules } = useQuery<EnabledModule[]>({
    queryKey: [`/api/org/${orgId}/modules`],
    enabled: !!orgId,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5 text-primary" />
              Active Modules
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Features enabled for your organization
            </CardDescription>
          </div>
          <Link href="/dashboard/marketplace">
            <Button variant="outline" size="sm" className="w-full sm:w-auto" data-testid="button-browse-marketplace">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Browse Marketplace
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {enabledModules && enabledModules.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {enabledModules.map((em) => (
              <div
                key={em.id}
                className="flex flex-col items-center p-3 border rounded-md hover-elevate"
                data-testid={`module-card-${em.module.moduleKey}`}
              >
                <Package className="w-8 h-8 text-primary mb-2" />
                <p className="font-medium text-sm text-center" data-testid={`text-module-title-${em.module.moduleKey}`}>
                  {em.module.title}
                </p>
                {em.module.isDefault && (
                  <Badge variant="secondary" className="mt-2 text-xs" data-testid={`badge-default-${em.module.moduleKey}`}>
                    Default
                  </Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No modules enabled yet
            </p>
            <Link href="/dashboard/marketplace">
              <Button variant="outline" className="mt-4" data-testid="button-explore-marketplace">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Explore Marketplace
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
