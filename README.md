# NYC Public Restroom Finder

A real-time, location-aware directory and map of New York City's public restrooms, built with React, Vite, Leaflet, and Cloudflare Pages.

This application consumes live data from the [NYC Open Data Portal](https://data.cityofnewyork.us/Recreation/Public-Restrooms/i7jb-7jku/data_preview) via the Socrata API and processes operating hours to provide an "Open Now" heuristic.

## Features

- **Geolocation & Proximal Search**: Uses `navigator.geolocation` or the free Nominatim OpenStreetMap API to find the closest bathrooms within a 1.5-mile radius of a user's location or searched address.
- **Operating Hours Engine**: Parses and translates complex municipal operating hours (e.g., "Dawn to dusk" or "8:00 AM - 4:00 PM") into real-time operational heuristics (Open, Maybe Open, Closed).
- **Theme Switcher**: Fully functional CSS-variable driven theme engine holding the Default (Dark) theme, an NYC Open Data (Light) theme, and a WeGovNYC (Light) theme.
- **Dynamic Maps**: Integrated `react-leaflet` mapping with responsive TileLayers that switch between CartoDB Dark Matter and Positron based on the active theme.
- **API Proxy**: Uses a Cloudflare Pages Function proxy (`functions/api/restrooms.js`) to cache Socrata upstream data at the edge, drastically speeding up initial loads.

## Local Development

You need Node.js (v18+) and `npm` installed.

### Setup

```bash
# Clone the repository
git clone https://github.com/wegovnyc/bathroom-demo.git
cd bathroom-demo

# Install dependencies
npm install
```

### Running Locally

Because the application relies on Cloudflare Pages Functions for its API proxy, you must run it using the `wrangler` CLI to simulate the edge proxy.

```bash
# Start the Vite server wrapped in the Wrangler edge proxy
npx wrangler pages dev -- npm run dev
```

The app will become available at `http://localhost:8788`.

## Deployment

Deploying this application to Cloudflare Pages is completely free and requires zero API keys.

1. **Push to GitHub**: Make sure this code is pushed to your GitHub account.
2. **Connect to Cloudflare**:
    - Log into the [Cloudflare Dashboard](https://dash.cloudflare.com/)
    - Go to **Workers & Pages** -> **Create Application** -> **Pages** -> **Connect to Git**
    - Select this repository.
3. **Build Settings**:
    - Framework Preset: `React` or `Vite`
    - Build Command: `npm run build`
    - Build Output Directory: `dist`
4. **Deploy**: Click **Save and Deploy**. Cloudflare will automatically build the site, deploy the backend `functions/api/restrooms.js` edge worker, and assign you a `.pages.dev` URL.

## Architecture & Privacy

This application intentionally does **NOT** use any proprietary map providers that require API keys (e.g., Google Maps, Mapbox).
- **Basemaps**: Provided by CartoDB (free tier).
- **Geocoding**: Handled by Nominatim API (OpenStreetMap), restricted via strict viewbox bounding to the 5 boroughs of NYC.
- **Privacy**: The application does not store user location data. The browser Geolocation API is processed entirely on the client side.
