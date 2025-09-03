import OpenAI from "openai";
import { GEO_PROMPT } from "./config";

interface GeoResponse {
  reply: string;
  topics: string[];
  suggestedFollowUps: string[];
  citations: Citation[];
}

interface Response {
  status: "success" | "error";
  data?: GeoResponse;
  error?: string;
}

interface ApiResponse extends GeoResponse {
  model: string;
  requestId?: string;
}

interface Citation {
  title: string;
  url: string;
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export async function createGeoresponse(request: string): Promise<Response> {
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
    const responseSchema = {
      name: "GeoAnswer",
      schema: {
        type: "object" as const,
        additionalProperties: false,
        properties: {
          reply: {
            type: "string" as const,
            description: "Concise, factual answer.",
          },
          topics: {
            type: "array" as const,
            items: { type: "string" as const },
            description: "Key geography topics extracted from the prompt.",
          },
          suggestedFollowUps: {
            type: "array" as const,
            items: { type: "string" as const },
            description: "Helpful follow-up questions for the user.",
          },
          citations: {
            type: "array" as const,
            items: {
              type: "object" as const,
              additionalProperties: false,
              properties: {
                title: { type: "string" as const },
                url: { type: "string" as const },
              },
              required: ["title", "url"],
            },
            description: "Optional external references if mentioned.",
          },
        },
        required: ["reply", "topics", "suggestedFollowUps", "citations"], // citations can be empty
      },
      strict: true,
    };

    const system = `${GEO_PROMPT}\nAlways produce valid JSON per the provided schema. Never include markdown fences.`;

    const resp = await openai.responses.parse({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      instructions: system,
      input: request,
      text: {
        format: {
          type: "json_schema",
          name: responseSchema.name,
          schema: responseSchema.schema,
          strict: responseSchema.strict,
        },
      },
      temperature: 0.3,
    });

    // Parse structured output with proper typing
    const parsed = (resp as any).output_parsed as GeoResponse | undefined;

    if (parsed) {
      const response: ApiResponse = {
        ...parsed,
        model: resp.model,
        requestId: resp._request_id || undefined,
      };
      return { status: "success", data: response };
    }

    return { status: "error", error: "Failed to parse response" };
  } catch (err: any) {
    console.error("Error in /chat", err?.status || err?.message || err);
    const status = typeof err?.status === "number" ? err.status : 500;
    return {
      status: "error",
      error: `OpenAI request failed: ${err?.message}` || "Unknown error",
    };
  }
}
