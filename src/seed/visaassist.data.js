const visaCategoriesSeed = [
  {
    name: "Tourist Visa",
    slug: "tourist-visa",
    description: "Short-term travel and visit support.",
    travelPurpose: "tourism",
    isActive: true,
    sopNotes: "Collect clear itinerary and return intent evidence.",
    processingGuidance: "Prioritize funds proof and purpose consistency.",
  },
  {
    name: "Student Visa",
    slug: "student-visa",
    description: "Study permit documentation and case coordination.",
    travelPurpose: "study",
    isActive: true,
    sopNotes: "Verify offer letters and tuition receipts.",
    processingGuidance: "Use institution-specific checklist.",
  },
  {
    name: "Work Visa",
    slug: "work-visa",
    description: "Employment visa documentation workflow.",
    travelPurpose: "work",
    isActive: true,
    sopNotes: "Cross-check employer sponsorship details.",
    processingGuidance: "Ensure contract and credential alignment.",
  },
];

const servicePackagesSeed = [
  {
    name: "Starter Documentation Pack",
    slug: "starter-documentation-pack",
    destinationCountry: "Canada",
    basePrice: 399,
    currency: "USD",
    isActive: true,
    description: "Entry-level advisory and document checklist support.",
    sopNotes: "Best for low-complexity visitor cases.",
    processingGuidance: "48-hour initial screening after onboarding.",
    complexityPricing: [
      { level: "low", multiplier: 1, fixedAdjustment: 0 },
      { level: "medium", multiplier: 1.3, fixedAdjustment: 40 },
      { level: "high", multiplier: 1.7, fixedAdjustment: 120 },
    ],
    countryPricing: [
      { countryCode: "CA", price: 399, currency: "USD" },
      { countryCode: "GB", price: 429, currency: "USD" },
      { countryCode: "AU", price: 449, currency: "USD" },
    ],
  },
];

module.exports = {
  visaCategoriesSeed,
  servicePackagesSeed,
};
