/**
 * Email delivery is disabled. All functions resolve successfully without sending mail
 * so the app behaves as if messages were sent (no Resend credentials required).
 */
export async function sendApprovalEmail(
  _to: string,
  _organizationName: string,
  _passwordSetupToken: string,
  _baseUrl: string
): Promise<boolean> {
  return true;
}

export async function sendRejectionEmail(
  _to: string,
  _organizationName: string,
  _reason: string
): Promise<boolean> {
  return true;
}

export async function sendNewRegistrationNotification(
  _adminEmail: string,
  _organizationData: {
    charityName: string;
    contactFirstName: string;
    contactLastName: string;
    contactEmail: string;
    country: string;
    submittedAt: Date;
  },
  _registrationId: string,
  _baseUrl: string
): Promise<boolean> {
  return true;
}

export async function sendTeamAdminInvitation(
  _to: string,
  _firstName: string,
  _lastName: string,
  _passwordSetupToken: string,
  _baseUrl: string
): Promise<boolean> {
  return true;
}

export async function sendTierUpgradeEmail(
  _to: string,
  _organizationName: string,
  _previousPlanName: string,
  _newPlanName: string,
  _memberCount: number,
  _baseUrl: string
): Promise<boolean> {
  return true;
}
