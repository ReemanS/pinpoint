"server-only";

import OpenAI from "openai";
import { GEO_PROMPT } from "./config";
import { zodTextFormat } from "openai/helpers/zod";
import {
  BaseGeoResponseDataSchema,
  GeoResponseDataSchema,
  type GeoResponseData,
} from "@/services/geo/schema";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

/**
 * Create a geography-aware AI response using OpenAI.
 * Throws on invalid input or configuration. Returns validated, typed data on success.
 */
export async function createGeoResponse(
  request: string
): Promise<GeoResponseData> {
  if (!request || typeof request !== "string" || request.trim() === "") {
    throw new Error("message is required as a non-empty string");
  }

  if (!OPENAI_API_KEY || !openai) {
    throw new Error("OpenAI API key/client is not configured");
  }

  try {
    const system = `${GEO_PROMPT}\nAlways produce valid JSON per the provided schema. Never include markdown fences.`;

    const modelResponse = await openai.responses.parse({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      instructions: system,
      input: request,
      text: {
        format: zodTextFormat(BaseGeoResponseDataSchema, "GeoResponse"),
      },
      temperature: 0.3,
    });

    const parsed = modelResponse.output_parsed;

    if (!parsed) {
      throw new Error("Failed to parse response");
    }

    // theres gotta be a better way to add these, but for now this sticks :D
    // add metadata and validate against the extended schema
    const withMeta = {
      ...parsed,
      model: modelResponse.model,
      requestId: modelResponse._request_id || undefined,
    };

    // Ensure the final shape matches our contract exactly
    const validated = GeoResponseDataSchema.parse(withMeta);
    return validated;
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    console.error("OpenAI error:", error?.status || error?.message || err);
    throw new Error(
      `OpenAI request failed: ${error?.message || "Unknown error"}`
    );
  }
}
