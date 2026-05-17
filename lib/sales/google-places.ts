// Google Places API client for lead discovery

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";
const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const NEARBY_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
const DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";

export interface GeoResult {
  lat: number;
  lng: number;
}

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviewCount: number | null;
  businessStatus: string | null;
}

export function hasApiKey(): boolean {
  return API_KEY.length > 0;
}

export async function geocodeLocation(location: string): Promise<GeoResult | null> {
  const url = `${GEOCODE_URL}?address=${encodeURIComponent(location)}&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK" || !data.results?.[0]) return null;

  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lng };
}

export async function searchNearby(
  lat: number,
  lng: number,
  keyword: string,
  placeType: string,
  maxResults: number
): Promise<PlaceResult[]> {
  const results: PlaceResult[] = [];
  let pageToken: string | null = null;
  let radius = 5000; // Start with 5km

  while (results.length < maxResults) {
    const params = new URLSearchParams({
      location: `${lat},${lng}`,
      radius: String(radius),
      keyword,
      type: placeType,
      key: API_KEY,
    });
    if (pageToken) {
      params.set("pagetoken", pageToken);
    }

    const url = `${NEARBY_URL}?${params}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") break;

    for (const place of data.results || []) {
      if (results.length >= maxResults) break;
      results.push({
        placeId: place.place_id,
        name: place.name,
        address: place.vicinity || "",
        lat: place.geometry?.location?.lat || lat,
        lng: place.geometry?.location?.lng || lng,
      });
    }

    pageToken = data.next_page_token || null;
    if (!pageToken) {
      // Auto-expand radius if not enough results
      if (results.length < maxResults * 0.5 && radius < 50000) {
        radius = Math.min(radius * 2, 50000);
        pageToken = null;
        continue;
      }
      break;
    }

    // Google requires a short delay before using next_page_token
    await new Promise((r) => setTimeout(r, 2000));
  }

  return results;
}

/**
 * Places Text Search — used when we already have a specific business name +
 * address (e.g. from DBPR) and want to look up its Google Places record for
 * phone, website, rating. Unlike Nearby Search this does not need geocoding
 * first; Google handles the query text directly.
 *
 * Returns the top result's placeId or null if no credible match.
 */
export async function textSearchPlace(query: string): Promise<string | null> {
  if (!API_KEY) return null;
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== "OK" || !data.results?.length) return null;
    return data.results[0].place_id ?? null;
  } catch {
    return null;
  }
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const fields = "name,formatted_address,formatted_phone_number,international_phone_number,website,rating,user_ratings_total,business_status";
  const url = `${DETAILS_URL}?place_id=${placeId}&fields=${fields}&key=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK" || !data.result) return null;

  const r = data.result;
  return {
    placeId,
    name: r.name || "",
    address: r.formatted_address || "",
    phone: r.formatted_phone_number || r.international_phone_number || null,
    website: r.website || null,
    rating: r.rating || null,
    reviewCount: r.user_ratings_total || null,
    businessStatus: r.business_status || null,
  };
}
