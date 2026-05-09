import { useQuery } from "@tanstack/react-query";
import { getCurrencySymbol } from "@shared/location-constants";
import { formatCurrency as baseFormatCurrency, formatDate as baseFormatDate, formatDateTime as baseFormatDateTime } from "@/lib/format-utils";

interface Organization {
  id: string;
  name: string;
  currency: string | null;
  dateFormat: string | null;
  timezone: string | null;
  country: string | null;
}

interface SessionResponse {
  user: { orgId: string };
}

export interface OrganizationLocale {
  currency: string;
  currencySymbol: string;
  dateFormat: string;
  timezone: string;
  country: string;
  formatCurrency: (amount: number | string) => string;
  formatDate: (date: Date | string | null) => string;
  formatDateTime: (date: Date | string | null, timeFormat?: "12h" | "24h") => string;
  isLoading: boolean;
}

const DEFAULT_LOCALE = {
  currency: "USD",
  dateFormat: "MM/DD/YYYY",
  timezone: "America/New_York",
  country: "US",
};

export function useOrganizationLocale(): OrganizationLocale {
  const { data: session } = useQuery<SessionResponse>({
    queryKey: ["/api/auth/session"],
  });

  const orgId = session?.user?.orgId;

  const { data: organization, isLoading } = useQuery<Organization>({
    queryKey: [`/api/org/${orgId}`],
    enabled: !!orgId,
  });

  const currency = organization?.currency || DEFAULT_LOCALE.currency;
  const dateFormat = organization?.dateFormat || DEFAULT_LOCALE.dateFormat;
  const timezone = organization?.timezone || DEFAULT_LOCALE.timezone;
  const country = organization?.country || DEFAULT_LOCALE.country;
  const currencySymbol = getCurrencySymbol(currency);

  const formatCurrency = (amount: number | string) => baseFormatCurrency(amount, currency);
  const formatDate = (date: Date | string | null) => baseFormatDate(date, dateFormat);
  const formatDateTime = (date: Date | string | null, timeFormat: "12h" | "24h" = "12h") => 
    baseFormatDateTime(date, dateFormat, timeFormat);

  return {
    currency,
    currencySymbol,
    dateFormat,
    timezone,
    country,
    formatCurrency,
    formatDate,
    formatDateTime,
    isLoading,
  };
}
