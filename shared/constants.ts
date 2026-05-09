// Country-based tax relief programs
export const TAX_RELIEF_PROGRAMS: Record<string, {
  name: string;
  description: string;
  label: string; // For checkbox
  rate: number; // Percentage charity can claim
  requiresAddress: boolean;
}> = {
  GB: { // United Kingdom
    name: "Gift Aid",
    description: "UK taxpayers can boost their donation by 25% at no extra cost",
    label: "Yes, I am a UK taxpayer and would like to claim Gift Aid",
    rate: 25, // Charity can claim 25p for every £1 donated
    requiresAddress: true,
  },
  US: { // United States  
    name: "Tax Deduction",
    description: "US donors may be able to deduct charitable contributions",
    label: "Yes, I would like to receive tax deduction documentation",
    rate: 0, // No direct claim for charity, but donor gets deduction
    requiresAddress: true,
  },
  CA: { // Canada
    name: "Tax Credit",
    description: "Canadian donors can receive tax credits for charitable donations",
    label: "Yes, I would like to receive a tax receipt",
    rate: 0, // Donor receives credit, not charity
    requiresAddress: true,
  },
  AU: { // Australia
    name: "Tax Deduction",
    description: "Donations to DGR-registered charities are tax deductible",
    label: "Yes, I would like to receive a tax deduction receipt",
    rate: 0,
    requiresAddress: true,
  },
};

// Helper to get tax relief program for a country
export function getTaxReliefProgram(countryCode?: string | null) {
  if (!countryCode) return null;
  return TAX_RELIEF_PROGRAMS[countryCode] || null;
}

// Religion-based donation categories mapping
export const DONATION_CATEGORIES_BY_RELIGION: Record<string, { value: string; label: string }[]> = {
  christian: [
    { value: "tithe", label: "Tithe" },
    { value: "offering", label: "Offering" },
    { value: "mission", label: "Mission" },
    { value: "building_fund", label: "Building Fund" },
    { value: "general", label: "General" },
  ],
  muslim: [
    { value: "zakat", label: "Zakat" },
    { value: "sadaqa", label: "Sadaqa" },
    { value: "lillah", label: "Lillah" },
    { value: "fidya", label: "Fidya" },
    { value: "kaffarah", label: "Kaffarah" },
    { value: "general", label: "General" },
  ],
  jewish: [
    { value: "tzedakah", label: "Tzedakah" },
    { value: "maaser", label: "Maaser" },
    { value: "pushke", label: "Pushke" },
    { value: "general", label: "General" },
  ],
  hindu: [
    { value: "dana", label: "Dana" },
    { value: "dakshina", label: "Dakshina" },
    { value: "seva", label: "Seva" },
    { value: "general", label: "General" },
  ],
  buddhist: [
    { value: "dana", label: "Dana (Generosity)" },
    { value: "merit_making", label: "Merit Making" },
    { value: "sangha_support", label: "Sangha Support" },
    { value: "general", label: "General" },
  ],
  other: [
    { value: "general", label: "General" },
    { value: "offering", label: "Offering" },
    { value: "donation", label: "Donation" },
  ],
};

// Helper function to get categories for a religion
export function getDonationCategories(religion?: string | null): { value: string; label: string }[] {
  if (!religion) {
    return [{ value: "general", label: "General" }];
  }
  // Normalize religion to lowercase for case-insensitive lookup
  const normalizedReligion = religion.toLowerCase().trim();
  return DONATION_CATEGORIES_BY_RELIGION[normalizedReligion] || DONATION_CATEGORIES_BY_RELIGION.other;
}
