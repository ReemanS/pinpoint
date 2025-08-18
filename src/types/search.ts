export interface SearchResult {
  id: string;
  name: string;
  coordinates: [number, number]; // [lng, lat]
  place_formatted?: string;
  full_address?: string;
}
