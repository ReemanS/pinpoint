import OpenAI from "openai";
import { GEO_PROMPT } from "./config";
import { zodTextFormat } from "openai/helpers/zod";
import { ApiResponse } from "@/services/api";
import { BaseGeoResponseDataSchema } from "@/services/geo/schema";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export async function createGeoResponse(request: string): Promise<ApiResponse> {
  if (!request || typeof request !== "string") {
    return {
      status: "error",
      error: "message is required as a non-empty string",
    };
  }

  if (!OPENAI_API_KEY) {
    return {
      status: "error",
      error: "OpenAI API key is not configured",
    };
  }

  if (!openai) {
    return {
      status: "error",
      error: "OpenAI client is not initialized",
    };
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

    if (parsed) {
      const response = {
        // theres gotta be a better way to add these, but for now this sticks :D
        ...parsed,
        model: modelResponse.model,
        requestId: modelResponse._request_id || undefined,
      };
      return { status: "success", data: response };
    } else {
      return { status: "error", error: "Failed to parse response" };
    }
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    console.error("Error: ", error?.status || error?.message || err);
    return {
      status: "error",
      error: `OpenAI request failed: ${error?.message || "Unknown error"}`,
    };
  }
}
