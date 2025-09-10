import { z } from "zod";

// Unified API response schema with Zod
export const ApiResponseSchema = z.object({
  status: z.enum(["success", "error"]),
  data: z.any().optional(),
  error: z.string().optional(),
});

export type ApiResponse<T = unknown> = {
  status: "success" | "error";
  data?: T;
  error?: string;
};

// Request options
export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}
