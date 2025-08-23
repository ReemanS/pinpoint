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
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
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
        const results: SearchResult[] = data.features.map((feature: unknown) => {
          const featureObj = feature as Record<string, unknown>;
          const properties = featureObj.properties as Record<string, unknown> | undefined;
          const geometry = featureObj.geometry as Record<string, unknown> | undefined;
          
          const id: string = (featureObj.id as string) || (properties?.mapbox_id as string) || "";
          const name: string = (properties?.name as string) ?? "Unnamed";
          const coords: [number, number] = Array.isArray(geometry?.coordinates)
            ? [geometry.coordinates[0] as number, geometry.coordinates[1] as number]
            : [
                (properties?.coordinates as Record<string, number>)?.longitude || 0,
                (properties?.coordinates as Record<string, number>)?.latitude || 0,
              ];
          const place_formatted: string | undefined = properties?.place_formatted as string | undefined;
          const full_address: string | undefined = properties?.full_address as string | undefined;
          const feature_type: string | undefined = properties?.feature_type as string | undefined;

          const bbox = properties?.bbox as [number, number, number, number] | undefined;

          return {
            id,
            name,
            coordinates: coords,
            place_formatted,
            full_address,
            bbox,
            feature_type,
          };
        });

        setSearchResults(results);
        if (results.length > 0) {
          setShowResults(true);
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (searchValue.length >= 3) {
      setIsSearching(true);
      performSearch(searchValue);
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
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search for a location..."
            className="map-search-input"
          />
          <button
            type="submit"
            className="map-search-button"
            disabled={isSearching}
          >
            Search
          </button>
        </div>

        {showResults && searchResults.length > 0 && (
          <div className="map-search-results">
            {searchResults.map((result) => (
              <div
                key={result.id}
                className="map-search-result-item"
                onClick={() => handleResultSelect(result)}
              >
                <div className="map-result-name">{result.name}</div>
                <div className="map-result-address">
                  {result.place_formatted || result.full_address}
                </div>
              </div>
            ))}
          </div>
        )}
      </form>

      {/* Reset moved to top-right in map-topbar */}
    </div>
  );
}

export default MapActions;
