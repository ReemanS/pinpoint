// API Base URLs
export const MAPBOX_API_BASE = "https://api.mapbox.com";
export const GEOCODING_API_URL = `${MAPBOX_API_BASE}/search/geocode/v6/forward`;

// search parameters
export const DEFAULT_SEARCH_CONFIG = {
  limit: 8,
  autocomplete: false,
  types: "country,region,postcode,district,place,locality,neighborhood",
};

// Map projection and styles
export const MAP_DEFAULTS = {
  center: [0, 0] as [number, number],
  zoom: 1.5,
  projection: "globe",
  style: "mapbox://styles/mapbox/standard",
  spinSettings: {
    secondsPerRevolution: 120,
    maxSpinZoom: 4,
    slowSpinZoom: 3,
  },
};

export function getMapboxToken(): string {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    throw new Error("Mapbox token required");
  }
  return token;
}
