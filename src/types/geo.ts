import { z } from "zod";

// Base Geo response data schema (what comes from OpenAI)
export const BaseGeoResponseDataSchema = z.object({
  reply: z
    .string()
    .describe(
      "A concise, factual answer to the geographical question. Keep it informative but brief."
    ),
  topics: z
    .array(z.string())
    .describe(
      "Key geographical topics, terms, or concepts extracted from the question and answer. Maximum 5 topics."
    ),
  suggestedFollowUps: z
    .array(z.string())
    .describe(
      "3-4 helpful follow-up questions the user might want to ask next, related to geography."
    ),
  citations: z
    .union([
      z.array(
        z.object({
          title: z.string().describe("Title of the reference source"),
          url: z.string().describe("URL of the reference source"),
        })
      ),
      z.null(),
    ])
    .describe(
      "External reference sources if specific facts, statistics, or specialized information was mentioned. Use null if no specific citations are needed."
    ),
});

// Extended schema with metadata added by the service
export const GeoResponseDataSchema = BaseGeoResponseDataSchema.extend({
  model: z.string().optional(),
  requestId: z.string().optional(),
});

export type GeoResponseData = z.infer<typeof GeoResponseDataSchema>;
