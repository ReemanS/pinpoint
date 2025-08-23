"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { SearchResult } from "../types/search";

interface MapActionsProps {
  center: [number, number];
  zoom: number;
  onFlyTo: (coordinates: [number, number], zoom?: number) => void;
  onDisplayBoundingBox: (bbox: [number, number, number, number] | null) => void;
}

function MapActions({
  center,
  zoom,
  onFlyTo,
  onDisplayBoundingBox,
}: MapActionsProps) {
  const [searchValue, setSearchValue] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    if (value.length < 3) {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  // Geocoding v6 forward
  // i was gonna used the Search Box API but turns out that's for
  // more complicated queries, not really what I was aiming for
  const performSearch = async (query: string) => {
    try {
      const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const params = new URLSearchParams({
        q: query,
        access_token: accessToken || "",
        limit: "8",
        autocomplete: "false",
        proximity: `${center[0]},${center[1]}`,
        types: "country,region,postcode,district,place,locality,neighborhood",
      });
      const url = `https://api.mapbox.com/search/geocode/v6/forward?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();

      if (data.features && Array.isArray(data.features)) {
        const results: SearchResult[] = data.features.map(
          (feature: unknown) => {
            const featureObj = feature as Record<string, unknown>;
            const properties = featureObj.properties as
              | Record<string, unknown>
              | undefined;
            const geometry = featureObj.geometry as
              | Record<string, unknown>
              | undefined;

            const id: string =
              (featureObj.id as string) ||
              (properties?.mapbox_id as string) ||
              "";
            const name: string = (properties?.name as string) ?? "Unnamed";
            const coords: [number, number] = Array.isArray(
              geometry?.coordinates
            )
              ? [
                  geometry.coordinates[0] as number,
                  geometry.coordinates[1] as number,
                ]
              : [
                  (properties?.coordinates as Record<string, number>)
                    ?.longitude || 0,
                  (properties?.coordinates as Record<string, number>)
                    ?.latitude || 0,
                ];
            const place_formatted: string | undefined =
              properties?.place_formatted as string | undefined;
            const full_address: string | undefined =
              properties?.full_address as string | undefined;
            const feature_type: string | undefined =
              properties?.feature_type as string | undefined;

            const bbox = properties?.bbox as
              | [number, number, number, number]
              | undefined;

            return {
              id,
              name,
              coordinates: coords,
              place_formatted,
              full_address,
              bbox,
              feature_type,
            };
          }
        );

        setSearchResults(results);
        if (results.length > 0) {
          setShowResults(true);
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      allowNextSearch.current = false;
      setIsSearching(false);
    }
  };

  // fly to the selected feature
  const handleRetrieve = (feature: any) => {
    const coords = feature?.geometry?.coordinates;
    if (Array.isArray(coords) && coords.length >= 2) {
      const [lng, lat] = coords as [number, number];
      onFlyTo([lng, lat], 14);
    }
  };

  // Handle result selection
  const handleResultSelect = (result: SearchResult) => {
    const [lng, lat] = result.coordinates;
    if (result.bbox) {
      // If bbox exists, display it and fit the map to it
      onDisplayBoundingBox(result.bbox);
      onFlyTo([lng, lat], 15);
    } else {
      // If no bbox, clear any existing one and zoom to point
      onDisplayBoundingBox(null);
      onFlyTo([lng, lat], 14);
    }

    setShowResults(false);
    setSearchValue(result.name);
  };

  return (
    <div className="map-actions-container">
      <div className="map-topbar">
        <div className="map-coords">
          <div>
            Longitude: {center[0].toFixed(4)} | Latitude: {center[1].toFixed(4)}
          </div>
          <div>Zoom: {zoom.toFixed(2)}</div>
        </div>
        <button
          onClick={() => onFlyTo([-157.3637, 1.9827], 13)}
          className="map-reset-button map-reset-button--small"
        >
          Reset
        </button>
      </div>

      <form onSubmit={handleSubmit} className="map-search-form">
        <div className="map-search-container">
          {/* Geocoder renders its own popover results. We:
              - pass the access token
              - keep the value controlled via onChange
              - handle onRetrieve to fly the map
              - use interceptSearch to block keystroke requests; only allow
                a request for the next submit-triggered search. */}
          <GeocoderAny
            ref={geocoderRef as any}
            accessToken={import.meta.env.VITE_MAPBOX_TOKEN}
            value={searchValue}
            onChange={(val: string) => setSearchValue(val)}
            onRetrieve={handleRetrieve}
            interceptSearch={(val: string) =>
              allowNextSearch.current ? val : ""
            }
            placeholder="Search for a location..."
            options={{
              limit: 6, // adjust as needed
              autocomplete: true,
              // Bias results toward current map center
              proximity: { lng: center[0], lat: center[1] },
            }}
          />
          <button
            type="submit"
            className="map-search-button"
            disabled={isSearching}
          >
            Search
          </button>
        </div>
      </form>
    </div>
  );
}

export default MapActions;
