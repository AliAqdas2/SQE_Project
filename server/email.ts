// Resend email integration using direct API
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
export function getResendClient() {
  const { apiKey, fromEmail } = getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail
  };
}

// Send organization approval email with password setup link
export async function sendApprovalEmail(
  to: string,
  organizationName: string,
  passwordSetupToken: string,
  baseUrl: string
) {
  const { client, fromEmail } = getResendClient();
  // Normalize baseUrl to ensure no double slashes
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, ''); // Remove trailing slashes
  const setupLink = `${normalizedBaseUrl}/setup-password?token=${passwordSetupToken}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Plegit</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              
              <!-- Header with gradient -->
              <tr>
                <td style="background: linear-gradient(135deg, #00BCD4 0%, #0097A7 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 600; letter-spacing: -0.5px;">
                    🎉 Congratulations!
                  </h1>
                  <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.95); font-size: 18px; line-height: 1.5;">
                    Your organization has been approved
                  </p>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                    Dear <strong>${organizationName}</strong> Team,
                  </p>
                  
                  <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                    We're thrilled to welcome you to <strong>Plegit</strong>, the modern fundraising platform designed specifically for faith-based organizations. Your application has been reviewed and approved!
                  </p>
                  
                  <!-- Call to Action Box -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin: 30px 0;">
                    <tr>
                      <td>
                        <h2 style="margin: 0 0 12px 0; font-size: 20px; color: #00BCD4; font-weight: 600;">
                          Get Started in 3 Simple Steps
                        </h2>
                        <ol style="margin: 0; padding-left: 20px; color: #555555; line-height: 1.8;">
                          <li style="margin-bottom: 8px;">Set up your account password</li>
                          <li style="margin-bottom: 8px;">Complete your organization profile</li>
                          <li style="margin-bottom: 0;">Create your first fundraising campaign</li>
                        </ol>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Primary CTA Button -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
                    <tr>
                      <td align="center">
                        <a href="${setupLink}" style="display: inline-block; background: linear-gradient(135deg, #00BCD4 0%, #0097A7 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(0,188,212,0.3); transition: all 0.3s ease;">
                          Set Up Your Password →
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Features Grid -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
                    <tr>
                      <td style="padding: 12px 0;">
                        <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #333333; font-weight: 600;">
                          What You Can Do with Plegit:
                        </h3>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="width: 50%; padding: 12px 12px 12px 0; vertical-align: top;">
                              <div style="display: flex; align-items: start;">
                                <span style="color: #00BCD4; font-size: 20px; margin-right: 8px;">✓</span>
                                <span style="color: #555555; font-size: 15px; line-height: 1.5;">Create unlimited fundraising campaigns</span>
                              </div>
                            </td>
                            <td style="width: 50%; padding: 12px 0 12px 12px; vertical-align: top;">
                              <div style="display: flex; align-items: start;">
                                <span style="color: #00BCD4; font-size: 20px; margin-right: 8px;">✓</span>
                                <span style="color: #555555; font-size: 15px; line-height: 1.5;">Generate QR codes for instant donations</span>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td style="width: 50%; padding: 12px 12px 12px 0; vertical-align: top;">
                              <div style="display: flex; align-items: start;">
                                <span style="color: #00BCD4; font-size: 20px; margin-right: 8px;">✓</span>
                                <span style="color: #555555; font-size: 15px; line-height: 1.5;">Manage donors and volunteers</span>
                              </div>
                            </td>
                            <td style="width: 50%; padding: 12px 0 12px 12px; vertical-align: top;">
                              <div style="display: flex; align-items: start;">
                                <span style="color: #00BCD4; font-size: 20px; margin-right: 8px;">✓</span>
                                <span style="color: #555555; font-size: 15px; line-height: 1.5;">Track donations in real-time</span>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td style="width: 50%; padding: 12px 12px 12px 0; vertical-align: top;">
                              <div style="display: flex; align-items: start;">
                                <span style="color: #00BCD4; font-size: 20px; margin-right: 8px;">✓</span>
                                <span style="color: #555555; font-size: 15px; line-height: 1.5;">Host events and sell tickets</span>
                              </div>
                            </td>
                            <td style="width: 50%; padding: 12px 0 12px 12px; vertical-align: top;">
                              <div style="display: flex; align-items: start;">
                                <span style="color: #00BCD4; font-size: 20px; margin-right: 8px;">✓</span>
                                <span style="color: #555555; font-size: 15px; line-height: 1.5;">Enable livestream giving</span>
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Support Info -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 24px 0; border-radius: 4px;">
                    <tr>
                      <td>
                        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #856404;">
                          <strong>Need Help?</strong><br>
                          Our support team is here for you. If you have any questions or need assistance getting started, don't hesitate to reach out to us.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 24px 0 0 0; font-size: 16px; line-height: 1.6; color: #333333;">
                    We're excited to see the amazing work your organization will accomplish with Plegit!
                  </p>
                  
                  <p style="margin: 20px 0 0 0; font-size: 16px; line-height: 1.6; color: #333333;">
                    Warm regards,<br>
                    <strong style="color: #00BCD4;">The Plegit Team</strong>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 24px 30px; border-top: 1px solid #e9ecef;">
                  <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.5; color: #6c757d; text-align: center;">
                    <strong>Important:</strong> This password setup link will expire in 7 days.
                  </p>
                  <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #6c757d; text-align: center;">
                    If you didn't request this, please ignore this email or contact our support team.
                  </p>
                  <p style="margin: 16px 0 0 0; font-size: 12px; line-height: 1.5; color: #adb5bd; text-align: center;">
                    © ${new Date().getFullYear()} Plegit. All rights reserved.
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

  const text = `
Congratulations! Your organization has been approved.

Dear ${organizationName} Team,

We're thrilled to welcome you to Plegit, the modern fundraising platform designed specifically for faith-based organizations. Your application has been reviewed and approved!

GET STARTED IN 3 SIMPLE STEPS:
1. Set up your account password
2. Complete your organization profile
3. Create your first fundraising campaign

Set up your password now: ${setupLink}

WHAT YOU CAN DO WITH PLEGIT:
✓ Create unlimited fundraising campaigns
✓ Generate QR codes for instant donations
✓ Manage donors and volunteers
✓ Track donations in real-time
✓ Host events and sell tickets
✓ Enable livestream giving

NEED HELP?
Our support team is here for you. If you have any questions or need assistance getting started, don't hesitate to reach out to us.

We're excited to see the amazing work your organization will accomplish with Plegit!

Warm regards,
The Plegit Team

---
IMPORTANT: This password setup link will expire in 7 days.
If you didn't request this, please ignore this email or contact our support team.

© ${new Date().getFullYear()} Plegit. All rights reserved.
  `.trim();

  await client.emails.send({
    from: fromEmail,
    to,
    subject: `🎉 Welcome to Plegit - ${organizationName} Approved!`,
    html,
    text,
  });
}

// Send organization rejection email
export async function sendRejectionEmail(
  to: string,
  organizationName: string,
  reason: string
) {
  const { client, fromEmail } = getResendClient();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #00BCD4;">Plegit Registration Update</h2>
      <p>Thank you for your interest in Plegit.</p>
      
      <p>Unfortunately, we are unable to approve the registration for <strong>${organizationName}</strong> at this time.</p>
      
      <h3>Reason:</h3>
      <p style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #00BCD4;">
        ${reason}
      </p>
      
      <p>If you believe this is an error or would like to discuss this further, please contact our support team.</p>
      
      <p style="color: #666; font-size: 12px; margin-top: 40px;">
        Thank you for your understanding.
      </p>
    </div>
  `;

  await client.emails.send({
    from: fromEmail,
    to,
    subject: `Plegit Registration Update - ${organizationName}`,
    html,
  });
}

// Send new registration notification to admin team
export async function sendNewRegistrationNotification(
  adminEmail: string,
  organizationData: {
    charityName: string;
    contactFirstName: string;
    contactLastName: string;
    contactEmail: string;
    country: string;
    submittedAt: Date;
  },
  registrationId: string,
  baseUrl: string
) {
  const { client, fromEmail } = getResendClient();
  const reviewLink = `${baseUrl}/admin/registrations`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #00BCD4;">New Organization Registration Submitted</h2>
      <p>A new organization has submitted their registration and is awaiting review.</p>
      
      <h3>Organization Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Organization Name:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${organizationData.charityName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Contact Person:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${organizationData.contactFirstName} ${organizationData.contactLastName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Contact Email:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${organizationData.contactEmail}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Country:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${organizationData.country}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Submitted:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${organizationData.submittedAt.toLocaleString()}</td>
        </tr>
      </table>
      
      <p style="margin: 30px 0;">
        <a href="${reviewLink}" style="background-color: #00BCD4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Review Registration
        </a>
      </p>
      
      <p style="color: #666; font-size: 12px; margin-top: 40px;">
        Registration ID: ${registrationId}
      </p>
    </div>
  `;

  await client.emails.send({
    from: fromEmail,
    to: adminEmail,
    subject: `New Registration: ${organizationData.charityName}`,
    html,
  });
}

// Send Team Admin invitation email with password setup link
export async function sendTeamAdminInvitation(
  to: string,
  firstName: string,
  lastName: string,
  passwordSetupToken: string,
  baseUrl: string
) {
  const { client, fromEmail } = getResendClient();
  // Normalize baseUrl to ensure no double slashes
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, ''); // Remove trailing slashes
  const setupLink = `${normalizedBaseUrl}/setup-password?token=${passwordSetupToken}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Plegit Team</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              
              <!-- Header with gradient -->
              <tr>
                <td style="background: linear-gradient(135deg, #00BCD4 0%, #0097A7 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 600; letter-spacing: -0.5px;">
                    Welcome to the Team!
                  </h1>
                  <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.95); font-size: 18px; line-height: 1.5;">
                    You've been invited to join Plegit
                  </p>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                    Hi <strong>${firstName} ${lastName}</strong>,
                  </p>
                  
                  <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                    Great news! You've been added as a <strong>Team Admin</strong> for the Plegit Eco Admin team. As a Team Admin, you'll have access to the platform's administrative dashboard to help manage organizations, partners, and system-wide settings.
                  </p>
                  
                  <!-- Call to Action Box -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin: 30px 0;">
                    <tr>
                      <td>
                        <h2 style="margin: 0 0 12px 0; font-size: 20px; color: #00BCD4; font-weight: 600;">
                          Get Started
                        </h2>
                        <p style="margin: 0; color: #555555; line-height: 1.8;">
                          To access your admin account, please set up your password by clicking the button below. This link will expire in 7 days.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Primary CTA Button -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
                    <tr>
                      <td align="center">
                        <a href="${setupLink}" style="display: inline-block; background: linear-gradient(135deg, #00BCD4 0%, #0097A7 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(0,188,212,0.3); transition: all 0.3s ease;">
                          Set Up Your Password →
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Admin Responsibilities -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
                    <tr>
                      <td style="padding: 12px 0;">
                        <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #333333; font-weight: 600;">
                          Your Admin Responsibilities:
                        </h3>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="width: 50%; padding: 12px 12px 12px 0; vertical-align: top;">
                              <div style="display: flex; align-items: start;">
                                <span style="color: #00BCD4; font-size: 20px; margin-right: 8px;">✓</span>
                                <span style="color: #555555; font-size: 15px; line-height: 1.5;">Review organization registrations</span>
                              </div>
                            </td>
                            <td style="width: 50%; padding: 12px 0 12px 12px; vertical-align: top;">
                              <div style="display: flex; align-items: start;">
                                <span style="color: #00BCD4; font-size: 20px; margin-right: 8px;">✓</span>
                                <span style="color: #555555; font-size: 15px; line-height: 1.5;">Manage partner relationships</span>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td style="width: 50%; padding: 12px 12px 12px 0; vertical-align: top;">
                              <div style="display: flex; align-items: start;">
                                <span style="color: #00BCD4; font-size: 20px; margin-right: 8px;">✓</span>
                                <span style="color: #555555; font-size: 15px; line-height: 1.5;">Monitor platform analytics</span>
                              </div>
                            </td>
                            <td style="width: 50%; padding: 12px 0 12px 12px; vertical-align: top;">
                              <div style="display: flex; align-items: start;">
                                <span style="color: #00BCD4; font-size: 20px; margin-right: 8px;">✓</span>
                                <span style="color: #555555; font-size: 15px; line-height: 1.5;">Support faith-based organizations</span>
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Support Info -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 24px 0; border-radius: 4px;">
                    <tr>
                      <td>
                        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #856404;">
                          <strong>Need Help?</strong><br>
                          If you have any questions about your admin account or responsibilities, please reach out to the platform administrator.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 24px 0 0 0; font-size: 16px; line-height: 1.6; color: #333333;">
                    We're excited to have you on the Plegit team!
                  </p>
                  
                  <p style="margin: 20px 0 0 0; font-size: 16px; line-height: 1.6; color: #333333;">
                    Best regards,<br>
                    <strong style="color: #00BCD4;">The Plegit Team</strong>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 24px 30px; border-top: 1px solid #e9ecef;">
                  <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.5; color: #6c757d; text-align: center;">
                    <strong>Important:</strong> This password setup link will expire in 7 days.
                  </p>
                  <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #6c757d; text-align: center;">
                    If you didn't expect this invitation, please contact the platform administrator.
                  </p>
                  <p style="margin: 16px 0 0 0; font-size: 12px; line-height: 1.5; color: #adb5bd; text-align: center;">
                    © ${new Date().getFullYear()} Plegit. All rights reserved.
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

  const text = `
Welcome to the Plegit Team!

Hi ${firstName} ${lastName},

Great news! You've been added as a Team Admin for the Plegit Eco Admin team. As a Team Admin, you'll have access to the platform's administrative dashboard to help manage organizations, partners, and system-wide settings.

GET STARTED:
To access your admin account, please set up your password by clicking the link below. This link will expire in 7 days.

Set up your password now: ${setupLink}

YOUR ADMIN RESPONSIBILITIES:
✓ Review organization registrations
✓ Manage partner relationships
✓ Monitor platform analytics
✓ Support faith-based organizations

NEED HELP?
If you have any questions about your admin account or responsibilities, please reach out to the platform administrator.

We're excited to have you on the Plegit team!

Best regards,
The Plegit Team

---
IMPORTANT: This password setup link will expire in 7 days.
If you didn't expect this invitation, please contact the platform administrator.

© ${new Date().getFullYear()} Plegit. All rights reserved.
  `.trim();

  await client.emails.send({
    from: fromEmail,
    to,
    subject: `Welcome to Plegit Team - Set Up Your Admin Account`,
    html,
    text,
  });
}

// Send automatic tier upgrade notification email
export async function sendTierUpgradeEmail(
  to: string,
  organizationName: string,
  previousPlanName: string,
  newPlanName: string,
  memberCount: number,
  baseUrl: string
) {
  const { client, fromEmail } = getResendClient();
  const dashboardLink = `${baseUrl}/dashboard/subscription`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Subscription Upgraded</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              
              <!-- Header with gradient -->
              <tr>
                <td style="background: linear-gradient(135deg, #00BCD4 0%, #0097A7 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                    Subscription Upgraded
                  </h1>
                  <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.95); font-size: 16px; line-height: 1.5;">
                    Your plan has been automatically updated
                  </p>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                    Dear <strong>${organizationName}</strong> Team,
                  </p>
                  
                  <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                    Great news! Your organization has grown, and we've automatically upgraded your subscription to accommodate your expanding community.
                  </p>
                  
                  <!-- Upgrade Details Box -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; border-radius: 8px; margin: 24px 0;">
                    <tr>
                      <td style="padding: 24px;">
                        <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #00BCD4; font-weight: 600;">
                          Upgrade Details
                        </h2>
                        <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #eee;">Previous Plan:</td>
                            <td style="padding: 8px 0; color: #333; font-weight: 500; border-bottom: 1px solid #eee; text-align: right;">${previousPlanName}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #666; border-bottom: 1px solid #eee;">New Plan:</td>
                            <td style="padding: 8px 0; color: #00BCD4; font-weight: 600; border-bottom: 1px solid #eee; text-align: right;">${newPlanName}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #666;">Current Members:</td>
                            <td style="padding: 8px 0; color: #333; font-weight: 500; text-align: right;">${memberCount.toLocaleString()}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                    Your new plan will be reflected in your next billing cycle. All your current features and data remain intact, and you now have access to higher capacity limits.
                  </p>
                  
                  <!-- CTA Button -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <a href="${dashboardLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #00BCD4 0%, #0097A7 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                          View Subscription Details
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #666666;">
                    If you have any questions about your subscription or billing, please don't hesitate to contact our support team.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 24px 30px; border-top: 1px solid #eee;">
                  <p style="margin: 0; font-size: 12px; color: #999; text-align: center;">
                    © ${new Date().getFullYear()} Plegit. All rights reserved.<br>
                    This is an automated message regarding your subscription.
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

  const text = `
Subscription Upgraded - ${organizationName}

Dear ${organizationName} Team,

Great news! Your organization has grown, and we've automatically upgraded your subscription to accommodate your expanding community.

UPGRADE DETAILS:
Previous Plan: ${previousPlanName}
New Plan: ${newPlanName}
Current Members: ${memberCount.toLocaleString()}

Your new plan will be reflected in your next billing cycle. All your current features and data remain intact, and you now have access to higher capacity limits.

View your subscription details: ${dashboardLink}

If you have any questions about your subscription or billing, please don't hesitate to contact our support team.

Best regards,
The Plegit Team

---
© ${new Date().getFullYear()} Plegit. All rights reserved.
This is an automated message regarding your subscription.
  `.trim();

  await client.emails.send({
    from: fromEmail,
    to,
    subject: `Subscription Upgraded: ${previousPlanName} → ${newPlanName}`,
    html,
    text,
  });
}
