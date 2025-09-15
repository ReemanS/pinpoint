"use server";

// Server Actions: central place to expose server-side functions to client components
import { getGeoResponse } from "@/services/geo";
import type { GeoResponseData } from "@/services/geo/schema";

/**
 * Server Action to get an AI-powered geo response.
 * Can be passed into Client Components as a prop and invoked directly.
 */
export async function getGeoResponseAction(
  prompt: string
): Promise<GeoResponseData> {
  return getGeoResponse(prompt);
}
