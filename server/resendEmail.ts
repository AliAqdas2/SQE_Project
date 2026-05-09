import { Resend } from 'resend';

// Get Resend credentials from environment variables
function getCredentials() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@plegit.app';

  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }

  return {
    apiKey,
    fromEmail
  };
}

// Get Resend client using environment variables
function getResendClient() {
  const { apiKey, fromEmail } = getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail
  };
}

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

export async function sendThankYouEmail(params: SendThankYouEmailParams): Promise<void> {
  try {
    const { client, fromEmail } = getResendClient();
    
    // Use custom template if provided, otherwise use default
    const subject = params.template?.subject || 
      `Thank you for your ${params.donationType} donation${params.organizationName ? ` to ${params.organizationName}` : ''}`;
    
    const htmlBody = params.template?.htmlBody || `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${params.logoUrl ? `
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${params.logoUrl}" alt="Organization Logo" style="max-width: 200px; height: auto;">
            </div>
          ` : ''}
          <h1 style="color: #2563eb; margin-bottom: 20px;">Thank You for Your Generous Donation!</h1>
          <p>Dear ${params.donorName},</p>
          <p>We are deeply grateful for your ${params.donationType} donation of <strong>${params.amount}</strong>.</p>
          <p>Your generosity makes a real difference in our mission${params.organizationName ? ` at ${params.organizationName}` : ''}.</p>
          <p>Thank you for your continued support!</p>
          <p style="margin-top: 30px;">
            With gratitude,<br>
            ${params.organizationName || 'Our Team'}
          </p>
        </body>
      </html>
    `;
    
    const textBody = params.template?.textBody || `
Dear ${params.donorName},

We are deeply grateful for your ${params.donationType} donation of ${params.amount}.

Your generosity makes a real difference in our mission${params.organizationName ? ` at ${params.organizationName}` : ''}.

Thank you for your continued support!

With gratitude,
${params.organizationName || 'Our Team'}
    `.trim();

    await client.emails.send({
      from: fromEmail,
      to: params.to,
      subject,
      html: htmlBody,
      text: textBody,
    });
  } catch (error) {
    console.error('Error sending thank you email:', error);
    throw new Error('Failed to send thank you email');
  }
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

export async function sendSubscriptionRenewalReminder(params: SendSubscriptionRenewalReminderParams): Promise<void> {
  try {
    const { client, fromEmail } = getResendClient();
    
    const subject = `Your ${params.planName} subscription renews in 7 days`;
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${params.logoUrl ? `
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${params.logoUrl}" alt="Organization Logo" style="max-width: 200px; height: auto;">
            </div>
          ` : ''}
          <h1 style="color: #2563eb; margin-bottom: 20px;">Subscription Renewal Reminder</h1>
          <p>Dear ${params.organizationName} Administrator,</p>
          <p>This is a friendly reminder that your <strong>${params.planName}</strong> subscription will automatically renew in 7 days.</p>
          
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #1f2937; font-size: 18px;">Renewal Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Plan:</td>
                <td style="padding: 8px 0; font-weight: bold;">${params.planName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Amount:</td>
                <td style="padding: 8px 0; font-weight: bold;">${params.currency} ${params.amount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Billing Cycle:</td>
                <td style="padding: 8px 0; font-weight: bold;">${params.billingCycle}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Renewal Date:</td>
                <td style="padding: 8px 0; font-weight: bold;">${params.renewalDate}</td>
              </tr>
            </table>
          </div>
          
          <p>Your payment method will be automatically charged on the renewal date. No action is required unless you wish to make changes.</p>
          
          <p>If you'd like to update your subscription or payment method, please log in to your account.</p>
          
          <p style="margin-top: 30px;">
            Thank you for your continued support!<br>
            <strong>Plegit Team</strong>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="font-size: 12px; color: #6b7280; text-align: center;">
            This is an automated reminder about your subscription renewal.<br>
            If you have any questions, please contact our support team.
          </p>
        </body>
      </html>
    `;
    
    const textBody = `
Subscription Renewal Reminder

Dear ${params.organizationName} Administrator,

This is a friendly reminder that your ${params.planName} subscription will automatically renew in 7 days.

Renewal Details:
- Plan: ${params.planName}
- Amount: ${params.currency} ${params.amount}
- Billing Cycle: ${params.billingCycle}
- Renewal Date: ${params.renewalDate}

Your payment method will be automatically charged on the renewal date. No action is required unless you wish to make changes.

If you'd like to update your subscription or payment method, please log in to your account.

Thank you for your continued support!
Plegit Team

---
This is an automated reminder about your subscription renewal.
If you have any questions, please contact our support team.
    `.trim();

    await client.emails.send({
      from: fromEmail,
      to: params.to,
      subject,
      html: htmlBody,
      text: textBody,
    });
    
    console.log(`Sent renewal reminder to ${params.to} for ${params.planName} subscription`);
  } catch (error) {
    console.error('Error sending renewal reminder email:', error);
    throw new Error('Failed to send renewal reminder email');
  }
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
  qrCodeString?: string; // The actual QR code string like EVT-D4DF4963-MK2XW8IQ
  organizationName?: string;
  logoUrl?: string;
}

export async function sendTicketConfirmationEmail(params: SendTicketConfirmationEmailParams): Promise<void> {
  try {
    const { client, fromEmail } = getResendClient();
    
    const subject = `Your Ticket${params.ticketCount > 1 ? 's' : ''} for ${params.eventTitle}`;
    
    const htmlBody = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Event Ticket Confirmation</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                
                <!-- Header with gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #00BCD4 0%, #0097A7 100%); padding: 40px 30px; text-align: center;">
                    ${params.logoUrl ? `
                      <img src="${params.logoUrl}" alt="Organization Logo" style="max-width: 150px; height: auto; margin-bottom: 20px;">
                    ` : ''}
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                      Your Ticket${params.ticketCount > 1 ? 's Are' : ' Is'} Confirmed!
                    </h1>
                    <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.95); font-size: 16px; line-height: 1.5;">
                      We're excited to see you at ${params.eventTitle}
                    </p>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                      Dear <strong>${params.firstName} ${params.lastName}</strong>,
                    </p>
                    
                    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                      Thank you for registering! Your payment has been confirmed and your ticket${params.ticketCount > 1 ? 's have' : ' has'} been issued.
                    </p>
                    
                    <!-- Event Details Card -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <tr>
                        <td style="padding: 4px 0;">
                          <table role="presentation" style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td style="padding: 8px 0; font-size: 14px; color: #666;">
                                <strong style="color: #333; display: block; margin-bottom: 4px;">Event</strong>
                                ${params.eventTitle}
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; font-size: 14px; color: #666;">
                                <strong style="color: #333; display: block; margin-bottom: 4px;">Date & Time</strong>
                                ${params.eventDate}${params.eventTime ? ` at ${params.eventTime}` : ''}
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; font-size: 14px; color: #666;">
                                <strong style="color: #333; display: block; margin-bottom: 4px;">Location</strong>
                                ${params.eventLocation}
                              </td>
                            </tr>
                            ${params.ticketTypeName ? `
                              <tr>
                                <td style="padding: 8px 0; font-size: 14px; color: #666;">
                                  <strong style="color: #333; display: block; margin-bottom: 4px;">Ticket Type</strong>
                                  ${params.ticketTypeName}
                                </td>
                              </tr>
                            ` : ''}
                            <tr>
                              <td style="padding: 8px 0; font-size: 14px; color: #666;">
                                <strong style="color: #333; display: block; margin-bottom: 4px;">Quantity</strong>
                                ${params.ticketCount} ticket${params.ticketCount > 1 ? 's' : ''}
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; font-size: 14px; color: #666;">
                                <strong style="color: #333; display: block; margin-bottom: 4px;">Total Paid</strong>
                                ${params.totalPaid}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- QR Code Section -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ffffff; border: 2px solid #00BCD4; border-radius: 8px; padding: 30px; margin: 30px 0; text-align: center;">
                      <tr>
                        <td>
                          <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #333;">Your Check-in QR Code</h2>
                          <p style="margin: 0 0 20px 0; font-size: 14px; color: #666;">
                            Present this QR code at the event entrance for quick check-in
                          </p>
                          <img src="${params.qrCodeDataUrl}" alt="Check-in QR Code" style="width: 200px; height: 200px; display: block; margin: 0 auto;">
                          ${params.qrCodeString ? `
                            <p style="margin: 16px 0 0 0; font-size: 14px; font-weight: bold; color: #333; font-family: monospace; background: #f5f5f5; padding: 8px; border-radius: 4px;">
                              ${params.qrCodeString}
                            </p>
                          ` : ''}
                          <p style="margin: 12px 0 0 0; font-size: 12px; color: #999;">
                            Save this email or take a screenshot • Staff will scan this code
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Important Information -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #FFF9E6; border-left: 4px solid #FFC107; padding: 16px; margin: 24px 0;">
                      <tr>
                        <td>
                          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #856404;">
                            <strong style="display: block; margin-bottom: 8px;">Important Information:</strong>
                            • Please arrive 15 minutes early for check-in<br>
                            • Bring a valid ID for verification<br>
                            • This ticket is valid for ${params.ticketCount} person${params.ticketCount > 1 ? 's' : ''}<br>
                            • No refunds after purchase
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 30px 0 0 0; font-size: 16px; line-height: 1.6; color: #333333;">
                      We look forward to seeing you at the event!
                    </p>
                    
                    <p style="margin: 16px 0 0 0; font-size: 16px; line-height: 1.6; color: #333333;">
                      Best regards,<br>
                      <strong>${params.organizationName || 'The Event Team'}</strong>
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 24px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="margin: 0; font-size: 12px; color: #6c757d; line-height: 1.6;">
                      This is an automated confirmation email for your event registration.<br>
                      If you have any questions, please contact the event organizer.
                    </p>
                    <p style="margin: 16px 0 0 0; font-size: 12px; color: #6c757d;">
                      © ${new Date().getFullYear()} ${params.organizationName || 'Plegit'}. All rights reserved.
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
    
    const textBody = `
Your Ticket${params.ticketCount > 1 ? 's Are' : ' Is'} Confirmed!

Dear ${params.firstName} ${params.lastName},

Thank you for registering for ${params.eventTitle}! Your payment has been confirmed.

EVENT DETAILS:
Event: ${params.eventTitle}
Date & Time: ${params.eventDate}${params.eventTime ? ` at ${params.eventTime}` : ''}
Location: ${params.eventLocation}
${params.ticketTypeName ? `Ticket Type: ${params.ticketTypeName}\n` : ''}Quantity: ${params.ticketCount} ticket${params.ticketCount > 1 ? 's' : ''}
Total Paid: ${params.totalPaid}

IMPORTANT INFORMATION:
• Please arrive 15 minutes early for check-in
• Bring a valid ID for verification
• Show the QR code in this email at the entrance
• This ticket is valid for ${params.ticketCount} person${params.ticketCount > 1 ? 's' : ''}
• No refunds after purchase

We look forward to seeing you at the event!

Best regards,
${params.organizationName || 'The Event Team'}

---
This is an automated confirmation email for your event registration.
If you have any questions, please contact the event organizer.

© ${new Date().getFullYear()} ${params.organizationName || 'Plegit'}. All rights reserved.
    `.trim();
    
    // QR code is now served via a proper URL endpoint (e.g., /api/qr/:eventId)
    // which email clients can fetch directly - no need for data URL conversion
    await client.emails.send({
      from: fromEmail,
      to: params.to,
      subject,
      html: htmlBody,
      text: textBody,
    });
    
    console.log(`Sent ticket confirmation email to ${params.to} for ${params.eventTitle}`);
  } catch (error) {
    console.error('Error sending ticket confirmation email:', error);
    throw new Error('Failed to send ticket confirmation email');
  }
}