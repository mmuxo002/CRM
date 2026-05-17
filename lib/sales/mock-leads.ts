// Realistic mock lead generator — used when GOOGLE_PLACES_API_KEY is not set

import { getNicheMapping } from "./niche-config";

export interface MockLead {
  businessName: string;
  phone: string | null;
  website: string | null;
  address: string;
  googleRating: number;
  googleReviewCount: number;
  googlePlaceId: string;
  isMock: true;
}

// Niche-specific business name prefixes/templates
const NICHE_NAMES: Record<string, string[]> = {
  "med spas": ["Elite Med Spa", "Glow Aesthetics", "Rejuvenate Med Spa", "Pure Radiance", "Luxe Med Spa", "Vitality Aesthetics", "Skin Renew Med Spa", "Aura Beauty Med Spa", "Bloom Med Spa", "Serenity Aesthetics", "The Glow Bar", "Prime Aesthetics", "Belle Med Spa", "Nova Skin Studio", "Zenith Med Spa"],
  dentists: ["Bright Smile Dental", "Family Dental Care", "Premier Dentistry", "Smile Studio", "Advanced Dental Arts", "Happy Teeth Dental", "Dental Excellence", "City Dental Group", "Modern Dental Care", "Sunrise Dental", "Peak Dental", "Coastal Dental", "Gentle Dental", "Elite Dental Care", "Fresh Smile Dental"],
  barbershops: ["Classic Cuts Barbershop", "The Gentleman's Quarter", "Sharp Edge Barbers", "King's Barbershop", "Fresh Fade Barbers", "The Cut Above", "Royal Barbershop", "Blade & Brush", "Old School Cuts", "The Mane Room", "Crown Barbershop", "Prime Cuts", "The Clip Joint", "Smooth Operators", "Urban Edge Barbers"],
  restaurants: ["The Golden Fork", "Savory Kitchen", "Bella Cucina", "The Local Bistro", "Spice House", "Garden Table", "Blue Flame Grill", "The Rustic Plate", "Ocean View Dining", "Casa Bonita", "The Hungry Bear", "Harvest Kitchen", "Flame & Stone", "The Corner Cafe", "Maple Street Kitchen"],
  "hair salons": ["Luxe Hair Studio", "The Mane Event", "Shear Perfection", "Strand Salon", "Glow Hair Studio", "Eclipse Salon", "The Hair Loft", "Silk & Scissors", "Radiant Hair Co", "Velvet Salon", "Bliss Hair Studio", "The Style Bar", "Crown Hair Studio", "Halo Salon", "Tressed Up Salon"],
  "law firms": ["Johnson & Associates", "Sterling Law Group", "Pacific Legal Partners", "Harbor Law Firm", "Shield Legal Services", "Pinnacle Law Group", "Atlas Legal", "Cornerstone Law", "Heritage Law Firm", "Summit Legal Partners", "Beacon Law Group", "Liberty Legal", "Ironclad Law Firm", "Guardian Legal", "Prestige Law"],
  "real estate agents": ["Prime Realty Group", "Keystone Real Estate", "Horizon Realty", "Landmark Properties", "Vista Real Estate", "Cornerstone Realty", "Summit Properties", "Coastal Realty Group", "Elite Home Team", "Pinnacle Real Estate", "Anchor Realty", "Crest Real Estate", "Atlas Property Group", "Heritage Homes", "Noble Realty"],
  "fitness & gyms": ["Iron Forge Fitness", "Peak Performance Gym", "Flex Zone", "Core Strength Studio", "PowerHouse Gym", "Titan Fitness", "Evolve Training", "Apex Fitness Center", "Pulse Gym", "Grind Fitness", "Elevate Training", "Beast Mode Gym", "FitLife Studio", "Surge Fitness", "Momentum Gym"],
  default: ["Premier Services", "Elite Solutions", "Pro Business Co", "Apex Group", "Summit Services", "Pinnacle Co", "First Choice Services", "Prime Solutions", "Star Business Group", "Pacific Services", "Harbor Co", "Coastal Solutions", "Metro Services", "Keystone Group", "Atlas Co"],
};

const STREET_NAMES = ["Main St", "Oak Ave", "Elm St", "Pine Rd", "Maple Dr", "Broadway", "Washington Blvd", "Park Ave", "1st Ave", "2nd St", "Market St", "Center Dr", "Lake Ave", "Sunrise Blvd", "Commerce Way", "Industrial Pkwy", "Ocean Dr", "Palm Ave", "Coral Way", "Biscayne Blvd"];

function randomPhone(): string {
  const area = Math.floor(Math.random() * 900) + 100;
  const mid = Math.floor(Math.random() * 900) + 100;
  const end = Math.floor(Math.random() * 9000) + 1000;
  return `(${area}) ${mid}-${end}`;
}

function randomRating(): number {
  // Weighted toward 3.5-4.5 range
  const base = 2.5 + Math.random() * 2.5;
  return Math.round(base * 10) / 10;
}

function randomReviewCount(): number {
  // Most businesses: 5-150 reviews, some have more
  const r = Math.random();
  if (r < 0.3) return Math.floor(Math.random() * 10) + 1; // Few reviews
  if (r < 0.7) return Math.floor(Math.random() * 80) + 10; // Moderate
  return Math.floor(Math.random() * 400) + 80; // Many
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20);
}

export function generateMockLeads(
  niche: string,
  location: string,
  count: number
): MockLead[] {
  const nicheKey = niche.toLowerCase();
  const names = NICHE_NAMES[nicheKey] || NICHE_NAMES["default"];
  const leads: MockLead[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    // Generate unique business name
    let baseName = names[i % names.length];
    let name = baseName;
    let suffix = 2;
    while (usedNames.has(name)) {
      name = `${baseName} ${location.split(",")[0]} ${suffix}`;
      suffix++;
    }
    usedNames.add(name);

    const streetNum = Math.floor(Math.random() * 9000) + 1000;
    const street = STREET_NAMES[Math.floor(Math.random() * STREET_NAMES.length)];
    const address = `${streetNum} ${street}, ${location}`;

    // ~40% of businesses have no website (these are the opportunities)
    const hasWebsite = Math.random() > 0.4;
    const slug = slugify(name);
    const website = hasWebsite ? `https://www.${slug}.com` : null;

    leads.push({
      businessName: name,
      phone: null, // No fake phone numbers — only real data from Google Places API
      website,
      address,
      googleRating: randomRating(),
      googleReviewCount: randomReviewCount(),
      googlePlaceId: `mock_place_${slug}_${Math.random().toString(36).slice(2, 8)}`,
      isMock: true,
    });
  }

  return leads;
}
