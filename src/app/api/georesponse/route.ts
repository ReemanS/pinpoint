// src/app/api/georesponse/route.ts

import { NextResponse } from "next/server";
import { createGeoResponse } from "@/services/openai";
import { ApiResponseSchema } from "@/services/api";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = typeof body === "string" ? body : body?.prompt;

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      return NextResponse.json(
        ApiResponseSchema.parse({
          status: "error",
          error: "prompt is required",
        }),
        { status: 400 }
      );
    }

    const result = await ApiResponseSchema.parseAsync(
      await createGeoResponse(prompt)
    );
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("/api/georesponse ERROR: ", err);
    return NextResponse.json(
      ApiResponseSchema.parse({
        status: "error",
        error: "Invalid request body",
      }),
      { status: 400 }
    );
  }
}
