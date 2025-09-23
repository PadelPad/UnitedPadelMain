// components/Club/clubFeatures.js
export const CLUB_FEATURES = {
  basic: {
    label: 'Basic',
    // dashboard/admin features (as before)
    canHostEvents: false,
    canCreateLeagues: false,
    analyticsCore: false,
    analyticsAdvanced: false,
    brandingCustomisation: false,
    visibilityBoost: false,
    sponsorShowcase: false,
    tournamentPriority: false,
    maxTeamSlots: 10,
    // NEW: public profile limits
    showcase: {
      maxPlayers: 3,
      maxCoaches: 2,
      maxEvents: 1,
      maxGallery: 3,
      showSponsors: false,
      showHours: false,
      showContact: true,  // can still show email/phone
      showBookingCta: true,
    },
  },
  plus: {
    label: 'Plus',
    canHostEvents: true,
    canCreateLeagues: false,
    analyticsCore: true,
    analyticsAdvanced: false,
    brandingCustomisation: true,
    visibilityBoost: true,
    sponsorShowcase: true,
    tournamentPriority: false,
    maxTeamSlots: 20,
    showcase: {
      maxPlayers: 6,
      maxCoaches: 4,
      maxEvents: 3,
      maxGallery: 8,
      showSponsors: true,
      showHours: true,
      showContact: true,
      showBookingCta: true,
    },
  },
  elite: {
    label: 'Elite',
    canHostEvents: true,
    canCreateLeagues: true,
    analyticsCore: true,
    analyticsAdvanced: true,
    brandingCustomisation: true,
    visibilityBoost: true,
    sponsorShowcase: true,
    tournamentPriority: true,
    maxTeamSlots: 50,
    showcase: {
      maxPlayers: 8,
      maxCoaches: 12,
      maxEvents: 8,
      maxGallery: 20,
      showSponsors: true,
      showHours: true,
      showContact: true,
      showBookingCta: true,
    },
  },
};

export function hasFeature(club, key) {
  const tier = club?.subscription_tier || club?.subscription_plan || 'basic';
  return !!CLUB_FEATURES[tier]?.[key];
}
