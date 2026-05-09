/**
 * Email delivery is disabled. All functions resolve successfully without sending mail.
 */

interface SendThankYouEmailParams {
  to: string;
  donorName: string;
  amount: string;
  donationType: string;
  template?: {
    subject: string;
    htmlBody: string;
    textBody: string;
  };
  organizationName?: string;
  logoUrl?: string;
}

export async function sendThankYouEmail(_params: SendThankYouEmailParams): Promise<boolean> {
  return true;
}

interface SendSubscriptionRenewalReminderParams {
  to: string;
  organizationName: string;
  planName: string;
  amount: string;
  currency: string;
  renewalDate: string;
  billingCycle: string;
  logoUrl?: string;
}

export async function sendSubscriptionRenewalReminder(
  _params: SendSubscriptionRenewalReminderParams
): Promise<boolean> {
  return true;
}

interface SendTicketConfirmationEmailParams {
  to: string;
  firstName: string;
  lastName: string;
  eventTitle: string;
  eventDate: string;
  eventTime?: string;
  eventLocation: string;
  ticketTypeName?: string;
  ticketCount: number;
  totalPaid: string;
  qrCodeDataUrl: string;
  qrCodeString?: string;
  organizationName?: string;
  logoUrl?: string;
}

export async function sendTicketConfirmationEmail(
  _params: SendTicketConfirmationEmailParams
): Promise<boolean> {
  return true;
}

/** Used when sending donation thank-you from custom HTML templates */
export async function resendEmail(_params: {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}): Promise<boolean> {
  return true;
}
