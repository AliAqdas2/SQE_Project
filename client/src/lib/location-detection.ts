import { getCountryConfig, type CountryConfig, COUNTRY_CONFIGS } from "@shared/location-constants";

export interface DetectedLocation {
  country: string;
  timezone: string;
  currency: string;
  dateFormat: string;
}

export function detectBrowserLocation(): DetectedLocation {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
  
  const locale = navigator.language || "en-US";
  const countryCode = locale.split("-")[1] || "US";
  
  const config = getCountryConfig(countryCode) || COUNTRY_CONFIGS[0];
  
  return {
    country: config.code,
    timezone: timezone,
    currency: config.currency,
    dateFormat: config.dateFormat,
  };
}

export function getTimezoneFromBrowser(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "America/New_York";
  }
}

export function getLocaleFromBrowser(): string {
  try {
    return navigator.language || "en-US";
  } catch {
    return "en-US";
  }
}
