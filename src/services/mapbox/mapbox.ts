import { z } from "zod";
import type { SearchResult } from "@/types/search";
import { ApiResponse } from "@/services/api";
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

// Mapbox API response schemas
const MapboxGeometry = z.object({
  type: z.string(),
  coordinates: z.tuple([z.number(), z.number()]),
});

const MapboxFeatureProperties = z.object({
  mapbox_id: z.string().optional(),
  name: z.string().optional(),
  place_formatted: z.string().optional(),
  full_address: z.string().optional(),
  feature_type: z.string().optional(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  coordinates: z
    .object({
      longitude: z.number(),
      latitude: z.number(),
    })
    .optional(),
});

const MapboxFeature = z.object({
  id: z.string(),
  type: z.string(),
  properties: MapboxFeatureProperties,
  geometry: MapboxGeometry,
});

const MapboxGeocodingResponse = z.object({
  type: z.string(),
  features: z.array(MapboxFeature),
});

type MapboxFeature = z.infer<typeof MapboxFeature>;

/**
 * Performs geocoding search using Mapbox Geocoding v6 API
 */
export async function searchLocations({
  query,
  center,
  limit = DEFAULT_SEARCH_CONFIG.limit,
  types = DEFAULT_SEARCH_CONFIG.types,
}: SearchParams): Promise<ApiResponse<SearchResult[]>> {
  try {
    const accessToken = getMapboxToken();

    if (!accessToken) {
      return {
        status: "error",
        error: "Mapbox access token is not configured",
      };
    }

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

    const rawData = await response.json();

    try {
      const data = MapboxGeocodingResponse.parse(rawData);
      const results = data.features.map(transformFeatureToSearchResult);

      return {
        status: "success",
        data: results,
      };
    } catch {
      return {
        status: "error",
        error: "Invalid response format from Mapbox API",
      };
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("NEXT_PUBLIC_MAPBOX_TOKEN")
    ) {
      return {
        status: "error",
        error: "Mapbox access token is not configured",
      };
    }

    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown search error",
    };
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
