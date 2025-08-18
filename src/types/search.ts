export interface SearchResult {
  id: string;
  name: string;
  coordinates: [number, number]; // [lng, lat]
  place_formatted?: string;
  full_address?: string;
  bbox?: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  feature_type?: string;
}
