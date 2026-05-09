import { db } from "./db";
import { emailTemplates } from "@shared/schema";
import { eq, and } from "drizzle-orm";

interface DefaultTemplate {
  name: string;
  templateType: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  donationType: string;
  priority: number;
  isDefault: boolean;
}

const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  {
    name: "Default Thank You Email",
    templateType: "donation_thank_you",
    subject: "Thank you for your generous donation!",
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #00BCD4; margin-bottom: 20px; font-size: 28px;">Thank You for Your Generous Donation!</h1>
    
    <p style="font-size: 16px; margin-bottom: 15px;">Dear {{donorName}},</p>
    
    <p style="font-size: 16px; margin-bottom: 15px;">
      We are deeply grateful for your <strong>{{donationType}}</strong> donation of <strong>{{amount}}</strong>.
    </p>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #00BCD4; margin: 25px 0;">
      <p style="margin: 0; font-size: 14px; color: #666;">
        <strong>Donation Details</strong><br>
        Date: {{date}}<br>
        Amount: {{amount}}<br>
        Type: {{donationType}}<br>
        Category: {{donationCategory}}<br>
        Campaign: {{campaignTitle}}
      </p>
    </div>
    
    <p style="font-size: 16px; margin-bottom: 15px;">
      Your generosity makes a real difference in our mission at <strong>{{organizationName}}</strong>. 
      Together, we are making a positive impact in our community.
    </p>
    
    <p style="font-size: 16px; margin-bottom: 15px;">
      Thank you for your continued support and for being part of our journey.
    </p>
    
    <p style="margin-top: 30px; font-size: 16px;">
      With heartfelt gratitude,<br>
      <strong>{{organizationName}}</strong>
    </p>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999; text-align: center;">
      <p>This is an automated receipt for your donation. Please keep this for your records.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
    textBody: `
Dear {{donorName}},

We are deeply grateful for your {{donationType}} donation of {{amount}}.

DONATION DETAILS
Date: {{date}}
Amount: {{amount}}
Type: {{donationType}}
Category: {{donationCategory}}
Campaign: {{campaignTitle}}

Your generosity makes a real difference in our mission at {{organizationName}}. Together, we are making a positive impact in our community.

Thank you for your continued support and for being part of our journey.

With heartfelt gratitude,
{{organizationName}}

---
This is an automated receipt for your donation. Please keep this for your records.
    `.trim(),
    donationType: "both",
    priority: 0,
    isDefault: true,
  }
];

export async function seedDefaultEmailTemplate(orgId: string): Promise<void> {
  console.log(`Seeding default email template for organization ${orgId}...`);
  
  try {
    for (const template of DEFAULT_TEMPLATES) {
      // Check if default template already exists for this org
      const existing = await db
        .select()
        .from(emailTemplates)
        .where(
          and(
            eq(emailTemplates.orgId, orgId),
            eq(emailTemplates.isDefault, true),
            eq(emailTemplates.templateType, template.templateType)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(emailTemplates).values({
          ...template,
          orgId,
        });
        console.log(`Created default template "${template.name}" for org ${orgId}`);
      } else {
        console.log(`Default template "${template.name}" already exists for org ${orgId}`);
      }
    }
  } catch (error) {
    console.error(`Error seeding default email template for org ${orgId}:`, error);
    throw error;
  }
}

export async function seedAllDefaultTemplates(): Promise<void> {
  console.log('Seeding default email templates for all organizations...');
  
  try {
    // This would be called during initial setup or migration
    // For now, we'll just log that this function exists
    console.log('Default template seed function ready');
  } catch (error) {
    console.error('Error seeding all default templates:', error);
    throw error;
  }
}
