import { z } from "zod";

// Base Geo response data schema (what comes from OpenAI)
export const BaseGeoResponseDataSchema = z.object({
  navigateTo: z
    .union([z.string(), z.null()])
    .describe(
      "The single, specific, modern day geographical location being discussed. This will be geocoded and sent to the Mapbox API for navigation. It should be on planet earth and the mapbox types supported are country,region,postcode,district,place,locality,neighborhood. Can be empty if not applicable, but try to always provide a valid location if possible."
    ),
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
