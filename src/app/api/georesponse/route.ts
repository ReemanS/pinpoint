// src/app/api/georesponse/route.ts

import { NextResponse } from "next/server";
import { createGeoresponse } from "@/services/openai/openai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = typeof body === "string" ? body : body?.prompt;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { status: "error", error: "prompt is required" },
        { status: 400 }
      );
    }

    const result = await createGeoresponse(prompt);
    return NextResponse.json(result);
  } catch (err) {
    console.error("/api/georesponse error", err);
    return NextResponse.json(
      { status: "error", error: "Invalid request body" },
      { status: 400 }
    );
  }
}
