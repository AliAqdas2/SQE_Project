import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrganizationLocale } from "@/hooks/use-organization-locale";

interface DonationAmountSelectorProps {
  onAmountChange?: (amount: number) => void;
  defaultAmount?: number;
}

const PRESET_AMOUNTS = [25, 50, 100, 250];

export function DonationAmountSelector({ 
  onAmountChange,
  defaultAmount = 50 
}: DonationAmountSelectorProps) {
  const { formatCurrency, currencySymbol } = useOrganizationLocale();
  const [selectedAmount, setSelectedAmount] = useState<number>(defaultAmount);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);

  const handlePresetClick = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustom(false);
    setCustomAmount("");
    onAmountChange?.(amount);
    console.log(`Selected preset amount: ${formatCurrency(amount)}`);
  };

  const handleCustomClick = () => {
    setIsCustom(true);
    console.log('Custom amount selected');
  };

  const handleCustomChange = (value: string) => {
    setCustomAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setSelectedAmount(numValue);
      onAmountChange?.(numValue);
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Select Amount</Label>
      
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {PRESET_AMOUNTS.map((amount) => (
          <Button
            key={amount}
            variant={selectedAmount === amount && !isCustom ? "default" : "outline"}
            className="min-h-12 text-lg font-semibold"
            onClick={() => handlePresetClick(amount)}
            data-testid={`button-amount-${amount}`}
          >
            {formatCurrency(amount)}
          </Button>
        ))}
        <Button
          variant={isCustom ? "default" : "outline"}
          className="min-h-12 text-lg font-semibold"
          onClick={handleCustomClick}
          data-testid="button-amount-custom"
        >
          Custom
        </Button>
      </div>

      {isCustom && (
        <div className="space-y-2">
          <Label htmlFor="custom-amount">Custom Amount</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              {currencySymbol}
            </span>
            <Input
              id="custom-amount"
              type="number"
              placeholder="0.00"
              className="pl-8 h-12 text-lg"
              value={customAmount}
              onChange={(e) => handleCustomChange(e.target.value)}
              data-testid="input-custom-amount"
              min="1"
              step="1"
            />
          </div>
        </div>
      )}
    </div>
  );
}
