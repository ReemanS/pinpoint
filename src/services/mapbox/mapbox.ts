import type { SearchResult } from "@/types/search";
import {
  GEOCODING_API_URL,
  DEFAULT_SEARCH_CONFIG,
  getMapboxToken,
} from "@/services/mapbox/config";

interface SearchParams {
  query: string;
  center: [number, number];
  limit?: number;
  types?: string;
}

// Mapbox API response interfaces
interface MapboxGeometry {
  type: string;
  coordinates: [number, number];
}

interface MapboxFeature {
  id: string;
  type: string;
  properties: MapboxFeatureProperties;
  geometry: MapboxGeometry;
}

interface MapboxFeatureProperties {
  mapbox_id?: string;
  name?: string;
  place_formatted?: string;
  full_address?: string;
  feature_type?: string;
  bbox?: [number, number, number, number];
  coordinates?: {
    longitude: number;
    latitude: number;
  };
}

interface MapboxGeocodingResponse {
  type: string;
  features: MapboxFeature[];
}

/**
 * Performs geocoding search using Mapbox Geocoding v6 API
 */
export async function searchLocations({
  query,
  center,
  limit = DEFAULT_SEARCH_CONFIG.limit,
  types = DEFAULT_SEARCH_CONFIG.types,
}: SearchParams): Promise<SearchResult[]> {
  try {
    const accessToken = getMapboxToken();

    const searchParams = new URLSearchParams({
      q: query,
      access_token: accessToken,
      limit: limit.toString(),
      autocomplete: DEFAULT_SEARCH_CONFIG.autocomplete.toString(),
      proximity: `${center[0]},${center[1]}`,
      types,
    });

    const url = `${GEOCODING_API_URL}?${searchParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Search failed with status: ${response.status}`);
    }

    const data: MapboxGeocodingResponse = await response.json();

    if (data.features && Array.isArray(data.features)) {
      return data.features.map(transformFeatureToSearchResult);
    }

    return [];
  } catch (error) {
    console.error("Search error:", error);

    if (
      error instanceof Error &&
      error.message.includes("NEXT_PUBLIC_MAPBOX_TOKEN")
    ) {
      console.warn("Missing NEXT_PUBLIC_MAPBOX_TOKEN; cannot perform search.");
    }

    return [];
  }
}

/**
 * transforms a Mapbox feature into our SearchResult format
 */
function transformFeatureToSearchResult(feature: MapboxFeature): SearchResult {
  const { properties, geometry } = feature;

  // Extract coordinates with fallback logic
  let coordinates: [number, number];
  if (geometry?.coordinates && Array.isArray(geometry.coordinates)) {
    coordinates = [geometry.coordinates[0], geometry.coordinates[1]];
  } else if (properties.coordinates) {
    coordinates = [
      properties.coordinates.longitude,
      properties.coordinates.latitude,
    ];
  } else {
    coordinates = [0, 0];
  }

  return {
    id: feature.id || properties.mapbox_id || "",
    name: properties.name || "Unnamed",
    coordinates,
    place_formatted: properties.place_formatted,
    full_address: properties.full_address,
    bbox: properties.bbox,
    feature_type: properties.feature_type,
  };
}
