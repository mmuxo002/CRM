// Niche → Google Places type mappings, service tiers, and expansion cities

export const NICHE_OPTIONS = [
  "Med Spas",
  "Dentists",
  "Chiropractors",
  "Barbershops",
  "Hair Salons",
  "Nail Salons",
  "Restaurants",
  "Cafes",
  "Fitness & Gyms",
  "Real Estate Agents",
  "Law Firms",
  "Accounting Firms",
  "Auto Dealers",
  "Auto Repair",
  "HVAC",
  "Plumbers",
  "Roofing",
  "Landscaping",
  "Pet Groomers",
  "Veterinarians",
  "Daycare Centers",
  "Photographers",
  "Wedding Venues",
  "Hotels",
  "Insurance Agents",
  "Other",
] as const;

export type NicheOption = (typeof NICHE_OPTIONS)[number];

export interface NicheMapping {
  keyword: string;
  placeType: string;
  servicesTiers: {
    primary: string[];
    secondary: string[];
    niceToHave: string[];
  };
  qualificationBonus: number; // extra points for this niche
}

export const NICHE_MAP: Record<string, NicheMapping> = {
  "med spas": {
    keyword: "med spa",
    placeType: "spa",
    servicesTiers: {
      primary: ["Landing Page", "Google My Business", "Voice AI Agent"],
      secondary: ["Appointment Reminders", "Social Media Marketing", "Review Management"],
      niceToHave: ["CRM Platform", "Patient Portal", "Business Automation"],
    },
    qualificationBonus: 15,
  },
  dentists: {
    keyword: "dentist",
    placeType: "dentist",
    servicesTiers: {
      primary: ["Landing Page", "Google My Business", "Voice AI Agent"],
      secondary: ["Appointment Reminders", "Review Management", "Patient Recall System"],
      niceToHave: ["Patient Portal", "CRM Platform", "Email Marketing"],
    },
    qualificationBonus: 15,
  },
  chiropractors: {
    keyword: "chiropractor",
    placeType: "health",
    servicesTiers: {
      primary: ["Landing Page", "Google My Business", "Online Booking"],
      secondary: ["Review Management", "Social Media Marketing", "Voice AI Agent"],
      niceToHave: ["CRM Platform", "Email Marketing", "Patient Portal"],
    },
    qualificationBonus: 10,
  },
  barbershops: {
    keyword: "barbershop",
    placeType: "hair_care",
    servicesTiers: {
      primary: ["Landing Page", "Google My Business", "Online Booking"],
      secondary: ["Social Media Marketing", "Review Management", "SMS Marketing"],
      niceToHave: ["Loyalty Program", "CRM Platform", "Business Automation"],
    },
    qualificationBonus: 10,
  },
  "hair salons": {
    keyword: "hair salon",
    placeType: "beauty_salon",
    servicesTiers: {
      primary: ["Landing Page", "Google My Business", "Online Booking"],
      secondary: ["Social Media Marketing", "Review Management", "SMS Marketing"],
      niceToHave: ["Loyalty Program", "CRM Platform", "Email Marketing"],
    },
    qualificationBonus: 10,
  },
  "nail salons": {
    keyword: "nail salon",
    placeType: "beauty_salon",
    servicesTiers: {
      primary: ["Landing Page", "Google My Business", "Online Booking"],
      secondary: ["Social Media Marketing", "Review Management", "SMS Marketing"],
      niceToHave: ["Loyalty Program", "Business Automation"],
    },
    qualificationBonus: 10,
  },
  restaurants: {
    keyword: "restaurant",
    placeType: "restaurant",
    servicesTiers: {
      primary: ["Landing Page", "Google My Business", "Online Ordering"],
      secondary: ["Social Media Marketing", "Review Management", "Voice AI Agent"],
      niceToHave: ["Loyalty Program", "Email Marketing", "Business Automation"],
    },
    qualificationBonus: 15,
  },
  cafes: {
    keyword: "cafe",
    placeType: "cafe",
    servicesTiers: {
      primary: ["Landing Page", "Google My Business", "Online Ordering"],
      secondary: ["Social Media Marketing", "Review Management"],
      niceToHave: ["Loyalty Program", "Email Marketing"],
    },
    qualificationBonus: 10,
  },
  "fitness & gyms": {
    keyword: "gym",
    placeType: "gym",
    servicesTiers: {
      primary: ["Landing Page", "Google My Business", "Online Booking"],
      secondary: ["Social Media Marketing", "Review Management", "Voice AI Agent"],
      niceToHave: ["CRM Platform", "Member Portal", "Business Automation"],
    },
    qualificationBonus: 10,
  },
  "real estate agents": {
    keyword: "real estate agent",
    placeType: "real_estate_agency",
    servicesTiers: {
      primary: ["Landing Page", "CRM Platform", "Lead Generation"],
      secondary: ["Social Media Marketing", "Google/Meta Ads", "Email Marketing"],
      niceToHave: ["Virtual Tours", "Voice AI Agent", "Business Automation"],
    },
    qualificationBonus: 10,
  },
  "law firms": {
    keyword: "law firm",
    placeType: "lawyer",
    servicesTiers: {
      primary: ["Landing Page", "Google My Business", "Voice AI Agent"],
      secondary: ["SEO", "Review Management", "CRM Platform"],
      niceToHave: ["Client Portal", "Email Marketing", "Business Automation"],
    },
    qualificationBonus: 15,
  },
  "accounting firms": {
    keyword: "accounting firm",
    placeType: "accounting",
    servicesTiers: {
      primary: ["Landing Page", "Google My Business", "CRM Platform"],
      secondary: ["SEO", "Email Marketing", "Review Management"],
      niceToHave: ["Client Portal", "Business Automation"],
    },
    qualificationBonus: 10,
  },
  "auto dealers": {
    keyword: "car dealer",
    placeType: "car_dealer",
    servicesTiers: {
      primary: ["Landing Page", "Google My Business", "CRM Platform"],
      secondary: ["Social Media Marketing", "Google/Meta Ads", "Review Management"],
      niceToHave: ["Voice AI Agent", "Business Automation", "Email Marketing"],
    },
    qualificationBonus: 10,
  },
  "auto repair": {
    keyword: "auto repair",
    placeType: "car_repair",
    servicesTiers: {
      primary: ["Landing Page", "Google My Business", "Voice AI Agent"],
      secondary: ["Review Management", "Appointment Reminders", "SMS Marketing"],
      niceToHave: ["CRM Platform", "Email Marketing"],
    },
    qualificationBonus: 10,
  },
  hvac: {
    keyword: "hvac",
    placeType: "home_goods_store",
    servicesTiers: {
      primary: ["Landing Page", "Google My Business", "Voice AI Agent"],
      secondary: ["SEO", "Google/Meta Ads", "Review Management"],
      niceToHave: ["CRM Platform", "Email Marketing", "Business Automation"],
    },
    qualificationBonus: 10,
  },
  plumbers: {
    keyword: "plumber",
    placeType: "plumber",
    servicesTiers: {
      primary: ["Landing Page", "Google My Business", "Voice AI Agent"],
      secondary: ["SEO", "Google/Meta Ads", "Review Management"],
      niceToHave: ["CRM Platform", "SMS Marketing"],
    },
    qualificationBonus: 10,
  },
  roofing: {
    keyword: "roofing",
    placeType: "roofing_contractor",
    servicesTiers: {
      primary: ["Landing Page", "Google My Business", "Lead Generation"],
      secondary: ["SEO", "Google/Meta Ads", "Review Management"],
      niceToHave: ["CRM Platform", "Business Automation"],
    },
    qualificationBonus: 10,
  },
  landscaping: {
    keyword: "landscaping",
    placeType: "general_contractor",
    servicesTiers: {
      primary: ["Landing Page", "Google My Business", "Voice AI Agent"],
      secondary: ["Social Media Marketing", "Review Management", "SEO"],
      niceToHave: ["CRM Platform", "Email Marketing"],
    },
    qualificationBonus: 10,
  },
  "pet groomers": {
    keyword: "pet grooming",
    placeType: "pet_store",
    servicesTiers: {
      primary: ["Landing Page", "Google My Business", "Online Booking"],
      secondary: ["Social Media Marketing", "Review Management", "SMS Marketing"],
      niceToHave: ["Loyalty Program", "Email Marketing"],
    },
    qualificationBonus: 10,
  },
  veterinarians: {
    keyword: "veterinarian",
    placeType: "veterinary_care",
    servicesTiers: {
      primary: ["Landing Page", "Google My Business", "Voice AI Agent"],
      secondary: ["Appointment Reminders", "Review Management", "Social Media Marketing"],
      niceToHave: ["Patient Portal", "CRM Platform", "Email Marketing"],
    },
    qualificationBonus: 10,
  },
  "daycare centers": {
    keyword: "daycare",
    placeType: "school",
    servicesTiers: {
      primary: ["Landing Page", "Google My Business", "Online Registration"],
      secondary: ["Social Media Marketing", "Review Management"],
      niceToHave: ["Parent Portal", "Email Marketing"],
    },
    qualificationBonus: 10,
  },
  photographers: {
    keyword: "photographer",
    placeType: "photographer",
    servicesTiers: {
      primary: ["Landing Page", "Google My Business", "Online Booking"],
      secondary: ["Social Media Marketing", "SEO", "Review Management"],
      niceToHave: ["CRM Platform", "Email Marketing"],
    },
    qualificationBonus: 10,
  },
  "wedding venues": {
    keyword: "wedding venue",
    placeType: "event_venue",
    servicesTiers: {
      primary: ["Landing Page", "Google My Business", "Online Booking"],
      secondary: ["Social Media Marketing", "SEO", "Review Management"],
      niceToHave: ["CRM Platform", "Virtual Tours", "Email Marketing"],
    },
    qualificationBonus: 10,
  },
  hotels: {
    keyword: "hotel",
    placeType: "lodging",
    servicesTiers: {
      primary: ["Landing Page", "Google My Business", "Online Booking"],
      secondary: ["Review Management", "Social Media Marketing", "SEO"],
      niceToHave: ["Voice AI Agent", "Email Marketing"],
    },
    qualificationBonus: 10,
  },
  "insurance agents": {
    keyword: "insurance agent",
    placeType: "insurance_agency",
    servicesTiers: {
      primary: ["Landing Page", "Google My Business", "CRM Platform"],
      secondary: ["SEO", "Google/Meta Ads", "Review Management"],
      niceToHave: ["Voice AI Agent", "Email Marketing", "Business Automation"],
    },
    qualificationBonus: 10,
  },
  other: {
    keyword: "",
    placeType: "establishment",
    servicesTiers: {
      primary: ["Landing Page", "Google My Business"],
      secondary: ["Social Media Marketing", "Review Management", "SEO"],
      niceToHave: ["CRM Platform", "Business Automation", "Email Marketing"],
    },
    qualificationBonus: 5,
  },
};

// State → expansion cities mapping for auto-expansion
export const STATE_EXPANSION_CITIES: Record<string, string[]> = {
  florida: ["Miami", "Fort Lauderdale", "West Palm Beach", "Boca Raton", "Orlando", "Tampa", "Jacksonville"],
  california: ["Los Angeles", "San Francisco", "San Diego", "Sacramento", "San Jose", "Fresno"],
  texas: ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth", "El Paso"],
  "new york": ["New York City", "Buffalo", "Rochester", "Albany", "Syracuse"],
  illinois: ["Chicago", "Aurora", "Naperville", "Rockford", "Springfield"],
  pennsylvania: ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading"],
  ohio: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron"],
  georgia: ["Atlanta", "Augusta", "Savannah", "Columbus", "Athens"],
  "north carolina": ["Charlotte", "Raleigh", "Durham", "Greensboro", "Winston-Salem"],
  michigan: ["Detroit", "Grand Rapids", "Warren", "Ann Arbor", "Lansing"],
  arizona: ["Phoenix", "Tucson", "Mesa", "Scottsdale", "Chandler"],
  colorado: ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Boulder"],
  washington: ["Seattle", "Spokane", "Tacoma", "Bellevue", "Everett"],
  massachusetts: ["Boston", "Worcester", "Springfield", "Cambridge", "Lowell"],
  nevada: ["Las Vegas", "Henderson", "Reno", "North Las Vegas", "Sparks"],
};

export function getNicheMapping(niche: string): NicheMapping {
  const key = niche.toLowerCase();
  return NICHE_MAP[key] || NICHE_MAP["other"];
}
