import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, QrCode, Edit, Layout, Settings } from "lucide-react";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";

interface CampaignCardProps {
  id: string;
  title: string;
  organization: string;
  imageUrl: string | null;
  raised: number;
  goal: number;
  donorCount: number;
  category?: string | null;
  onQRCodeClick?: () => void;
  onEditClick?: () => void;
  onPageBuilderClick?: () => void;
  onManageClick?: () => void;
  onDonateClick?: () => void;
}

export function CampaignCard({
  title,
  organization,
  imageUrl,
  raised,
  goal,
  donorCount,
  category,
  onQRCodeClick,
  onEditClick,
  onPageBuilderClick,
  onManageClick,
  onDonateClick,
}: CampaignCardProps) {
  const { formatCurrency } = useOrganizationLocale();
  const percentComplete = Math.min((raised / goal) * 100, 100);

  return (
    <Card className="overflow-hidden hover-elevate transition-all duration-200" data-testid={`card-campaign-${title}`}>
      <div className="relative h-48 overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <span className="text-4xl">📝</span>
          </div>
        )}
        {category && (
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
              {category}
            </Badge>
          </div>
        )}
      </div>
      
      <CardHeader className="space-y-2 pb-3">
        <h3 className="text-xl font-semibold leading-tight line-clamp-2">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{organization}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-semibold">
              {formatCurrency(raised)} raised
            </span>
            <span className="text-muted-foreground">
              of {formatCurrency(goal)}
            </span>
          </div>
          <Progress value={percentComplete} className="h-2" />
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Heart className="h-4 w-4" />
          <span>{donorCount} donors</span>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col gap-3">
        <Button 
          className="w-full" 
          data-testid="button-donate"
          onClick={onDonateClick}
        >
          Donate Now
        </Button>
        
        <div className="flex gap-2 w-full flex-wrap">
          {onQRCodeClick && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onQRCodeClick}
              data-testid="button-qr-code"
            >
              <QrCode className="h-4 w-4 mr-1" />
              QR Code
            </Button>
          )}
          {onManageClick && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onManageClick}
              data-testid="button-manage"
            >
              <Settings className="h-4 w-4 mr-1" />
              Manage
            </Button>
          )}
          {onEditClick && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onEditClick}
              data-testid="button-edit"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
          {onPageBuilderClick && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onPageBuilderClick}
              data-testid="button-page-builder"
            >
              <Layout className="h-4 w-4 mr-1" />
              Customize
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
