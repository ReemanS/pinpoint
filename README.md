# Pinpoint

A learning project in using the Mapbox API and more

Built with Next.js 15.x and React 19

## Features

- Interactive map powered by Mapbox GL JS
- Dark/light theme
- Location search using Mapbox Geocoding API v6
- Bounding box visualization for search results
- TypeScript support

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and add your Mapbox token:
   ```
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
   ```
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Build

To create a production build:

```bash
npm run build
npm start
```
