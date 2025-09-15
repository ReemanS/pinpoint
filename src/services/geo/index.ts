"server-only";

import { createGeoResponse } from "@/services/openai";
import type { GeoResponseData } from "@/services/geo/schema";

/**
 * (Server function) Get an AI-powered geographical response.
 */
export async function getGeoResponse(prompt: string): Promise<GeoResponseData> {
  const trimmed = typeof prompt === "string" ? prompt.trim() : "";
  if (!trimmed) {
    throw new Error("Prompt is required and must not be empty");
  }

  // Delegate to OpenAI service (already server-only and validated)
  const data = await createGeoResponse(trimmed);
  return data;
}
