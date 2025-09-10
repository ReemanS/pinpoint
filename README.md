# Pinpoint

An exploratory geography-focused web app combining Mapbox's globe visualization with an AI assistant for concise geographic answers and smart navigation.

A bring-your-own API key project.

## ✨ Features

- 🌍 Interactive 3D globe (Mapbox GL JS, globe projection)
- 🔍 Geocoding (Mapbox Geocoding API v6) with bounding box highlighting
- 💬 AI geography assistant (OpenAI Responses API with structured JSON parsing and validation via Zod)
- 🧭 Auto-navigation: AI replies can trigger fly-to on relevant locations
- 🌓 Dark / Light theme with context + toggle
- 🧱 Clean service-layer architecture (`/services/mapbox`, `/services/geo`, `/services/openai`)

## 🧩 How It Works

1. User asks a geography-related question in the central input.
2. The OpenAI service (`createGeoResponse`) sends the prompt with a strict system instruction + Zod enforced schema.
3. Response is parsed (topics, suggested follow-ups, optional navigateTo, citations, reply).
4. If `navigateTo` is present, a forward geocode runs and the map flies to the best match.
5. The conversation history displays in a scrollable panel when you've interacted.

## 🔑 Environment Variables

Create an `.env` file (never commit real keys):

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_public_token
OPENAI_API_KEY=sk-your_openai_key
# Optional: override model (defaults to gpt-4o-mini)
# OPENAI_MODEL=gpt-4o-mini
```

## 🚀 Development

```bash
git clone https://github.com/ReemanS/pinpoint.git
cd pinpoint
npm install
cp .env.example .env
# fill in env vars
npm run dev
```

Open http://localhost:3000

## 🗺️ Using the App

1. Pan / zoom the globe.
2. Ask a question: e.g. "Capital of the Philippines".
3. If the AI includes `navigateTo`, the map moves there automatically.
4. Click the title (Pinpoint) when docked to return to the centered hero state.
5. Toggle theme with the theme switch.

## 🧪 Type Safety & Validation

- Zod for AI response validation ensures predictable structure.
- Response mapping for Mapbox features (`transformFeatureToSearchResult`).
- Centralized API response type: `ApiResponse<T>`.
