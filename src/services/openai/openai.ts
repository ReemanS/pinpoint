import OpenAI from "openai";
import { GEO_PROMPT } from "./config";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

// lets try using zod now
export const APIResponse = z.object({
  status: z.enum(["success", "error"]),
  data: z.optional(z.any()),
  error: z.optional(z.string()),
});

// const ModelInfo = z.object({
//   model: z.string(),
//   requestId: z.optional(z.string()),
// });

const GeoResponse = z.object({
  reply: z.string(),
  topics: z.array(z.string()),
  suggestedFollowUps: z.array(z.string()),
  citations: z
    .array(
      z.object({
        title: z.string(),
        url: z.string(),
      })
    )
    .optional()
    .nullable(),
});

// interface GeoResponse2 {
//   reply: string;
//   topics: string[];
//   suggestedFollowUps: string[];
//   citations: Citation[];
// }

// interface Response {
//   status: "success" | "error";
//   data?: GeoResponse;
//   error?: string;
// }

// interface ApiResponse extends GeoResponse {
//   model: string;
//   requestId?: string;
// }

// interface Citation2 {
//   title: string;
//   url: string;
// }

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export async function createGeoresponse(
  request: string
): Promise<z.infer<typeof APIResponse>> {
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
    // const responseSchema = {
    //   name: "GeoResponse",
    //   schema: {
    //     type: "object" as const,
    //     additionalProperties: false,
    //     properties: {
    //       reply: {
    //         type: "string" as const,
    //         description: "Concise, factual answer.",
    //       },
    //       topics: {
    //         type: "array" as const,
    //         items: { type: "string" as const },
    //         description: "Key geography topics extracted from the prompt.",
    //       },
    //       suggestedFollowUps: {
    //         type: "array" as const,
    //         items: { type: "string" as const },
    //         description: "Helpful follow-up questions for the user.",
    //       },
    //       citations: {
    //         type: "array" as const,
    //         items: {
    //           type: "object" as const,
    //           additionalProperties: false,
    //           properties: {
    //             title: { type: "string" as const },
    //             url: { type: "string" as const },
    //           },
    //           required: ["title", "url"],
    //         },
    //         description: "Optional external references if mentioned.",
    //       },
    //     },
    //     required: ["reply", "topics", "suggestedFollowUps", "citations"], // citations can be empty
    //   },
    //   strict: true,
    // };

    const system = `${GEO_PROMPT}\nAlways produce valid JSON per the provided schema. Never include markdown fences.`;

    const modelResponse = await openai.responses.parse({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      instructions: system,
      input: request,
      text: {
        format: zodTextFormat(GeoResponse, "GeoResponse"),
      },
      temperature: 0.3,
    });

    // now a GeoResponse
    const parsed = modelResponse.output_parsed;

    if (parsed) {
      const response = {
        // not so best practice with me modifying the schema at this stage but oh well
        ...parsed,
        model: modelResponse.model,
        requestId: modelResponse._request_id || undefined,
      };
      return { status: "success", data: response };
    } else {
      return { status: "error", error: "Failed to parse response" };
    }
  } catch (err: any) {
    console.error("Error: ", err?.status || err?.message || err);
    return {
      status: "error",
      error: `OpenAI request failed: ${err?.message}` || "Unknown error",
    };
  }
}
