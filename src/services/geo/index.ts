import { apiClient, ApiResponse, ApiResponseSchema } from "@/services/api";
import { GeoResponseDataSchema, GeoResponseData } from "@/types/geo";

// Extend the base ApiResponse schema with our specific data type
// now we're using and modifying the unified types
const GeoApiResponseSchema = ApiResponseSchema.extend({
  data: GeoResponseDataSchema.optional(),
});

/**
 * Get AI-powered geographical response
 */
export async function getGeoResponse(
  prompt: string
): Promise<ApiResponse<GeoResponseData>> {
  if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
    return {
      status: "error",
      error: "Prompt is required and must not be empty",
    };
  }

  const response = await apiClient("/api/georesponse", {
    method: "POST",
    body: { prompt: prompt.trim() },
  });

  if (response.status === "error") {
    return {
      status: "error",
      error: response.error,
    };
  }

  try {
    const validatedResponse = GeoApiResponseSchema.parse(response.data);

    if (validatedResponse.status === "error") {
      return {
        status: "error",
        error: validatedResponse.error || "Unknown error from geo response API",
      };
    }

    if (validatedResponse.data) {
      return {
        status: "success",
        data: validatedResponse.data,
      };
    }

    return {
      status: "error",
      error: "No data received from geo response API",
    };
  } catch (error) {
    return {
      status: "error",
      error: `Invalid response format from geo response API. Details: ${error}`,
    };
  }
}
