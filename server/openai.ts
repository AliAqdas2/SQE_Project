/**
 * External LLM / OpenAI is intentionally not used. Nothing here reads OPENAI_API_KEY
 * or imports the `openai` npm package. These helpers return static placeholder data
 * so HTTP routes work in dev and offline builds.
 */

/** 1×1 transparent PNG (base64). */
export const STUB_PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

export function defaultCampaignAiPayload(title: string, briefDescription: string, target: string) {
  return {
    description: `Thank you for supporting "${title}". ${briefDescription}\n\nTogether we are working toward our goal of ${target}. Your generosity helps us serve our community with care and transparency.\n\nThis is sample copy while automated generation is turned off — replace it with your own story anytime.`,
    quickDonations: [
      { amount: 25, description: "Starter gift — makes a difference" },
      { amount: 50, description: "Strong support — funds program needs" },
      { amount: 100, description: "Leadership giving — moves the campaign forward" },
    ],
    bannerPrompt: `Hopeful community fundraiser: ${title}`,
  };
}

export function defaultGoalSuggestions() {
  return {
    conservative: {
      amount: 5000,
      reasoning: "Placeholder tier (AI disabled). Choose a goal that matches your list size.",
    },
    moderate: {
      amount: 10000,
      reasoning: "Placeholder tier (AI disabled). Adjust based on past campaigns.",
    },
    ambitious: {
      amount: 25000,
      reasoning: "Placeholder stretch goal (AI disabled).",
    },
    insights: "These values are samples only. Set goals that fit your community.",
  };
}

export function defaultRegeneratedStory(campaignTitle: string, style: string) {
  return `Placeholder description for "${campaignTitle}" (${style} style). Automated rewriting is off — edit this text to match your organization's voice.\n\nShare why the work matters, who benefits, and what donations make possible.`;
}

export function defaultCampaignChatReply() {
  return "Thanks for your question. The campaign assistant is not available in this deployment. Use your team's playbooks or edit the campaign directly; for strategy, try the impact report after you have donor data.";
}

export function defaultFundraisingStrategyJson() {
  const points = (topic: string) => [
    `Sample ${topic} idea 1 — enable an LLM for tailored plans.`,
    `Sample ${topic} idea 2 — review with your team.`,
    `Sample ${topic} idea 3 — adjust for your region and audience.`,
  ];
  const donorOutreach = points("donor outreach");
  return {
    donorOutreach,
    socialMedia: points("social"),
    messaging: points("messaging"),
    events: points("events"),
    eventIdeas: points("events"),
    onlineCommunities: points("communities"),
  };
}

export function defaultEventAiStructuredText(keywords: string) {
  return `TITLE: ${keywords.trim()} Gathering
DESCRIPTION: You're invited to ${keywords.trim()} — a welcoming time for our community. More details will follow. Bring a friend!

IMAGE_CONCEPT: Warm community gathering, ${keywords.trim()}, soft lighting`;
}

export function defaultEventDescription(
  title: string,
  eventType: string,
  location: string,
  date: string
) {
  return `Join us for ${title}${date ? ` on ${date}` : ""}. ${
    eventType === "virtual" ? "Online event." : `Location: ${location || "TBD"}.`
  }

Placeholder copy (AI disabled). Replace with your invitation text.`;
}

export function defaultPrayerModeration() {
  return {
    isAppropriate: true,
    flagReason: null,
    suggestedCategory: "other",
    sentiment: "neutral",
    moderationNotes: "AI moderation disabled — approved by default.",
  };
}

export function defaultPublicChatReply(orgName: string, orgEmail: string) {
  return `Thanks for visiting ${orgName}. Our chat assistant isn't running in this environment. For questions, please contact us at ${orgEmail}.`;
}

