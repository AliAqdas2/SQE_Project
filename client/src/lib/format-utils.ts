import { format } from "date-fns";
import { getCurrencySymbol } from "@shared/location-constants";

export function formatCurrency(
  amount: number | string,
  currencyCode: string = "USD"
): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return `${getCurrencySymbol(currencyCode)}0.00`;
  }

  const symbol = getCurrencySymbol(currencyCode);
  
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);

  return `${symbol}${formatted}`;
}

export function formatDate(
  date: Date | string | null,
  dateFormat: string = "MM/DD/YYYY"
): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return "";
  }

  const formatMap: { [key: string]: string } = {
    "MM/DD/YYYY": "MM/dd/yyyy",
    "DD/MM/YYYY": "dd/MM/yyyy",
    "YYYY-MM-DD": "yyyy-MM-dd",
    "DD.MM.YYYY": "dd.MM.yyyy",
    "DD-MM-YYYY": "dd-MM-yyyy",
    "YYYY/MM/DD": "yyyy/MM/dd",
  };

  const dateFnsFormat = formatMap[dateFormat] || "MM/dd/yyyy";
  
  try {
    return format(dateObj, dateFnsFormat);
  } catch {
    return format(dateObj, "MM/dd/yyyy");
  }
}

export function formatDateTime(
  date: Date | string | null,
  dateFormat: string = "MM/DD/YYYY",
  timeFormat: "12h" | "24h" = "12h"
): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return "";
  }

  const datePart = formatDate(dateObj, dateFormat);
  const timeFormatString = timeFormat === "12h" ? "h:mm a" : "HH:mm";
  
  try {
    const timePart = format(dateObj, timeFormatString);
    return `${datePart} ${timePart}`;
  } catch {
    return datePart;
  }
}

export function parseAmount(amountStr: string): number {
  const cleaned = amountStr.replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
