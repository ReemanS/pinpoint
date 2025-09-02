"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { searchLocations } from "@/api/mapbox";
import { MAP_DEFAULTS } from "@/api/config";
import type { SearchResult } from "@/types/search";

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
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

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
      setIsSearching(true);
      const results = await searchLocations({
        query,
        center,
        limit: 8,
        types: "country,region,postcode,district,place,locality,neighborhood",
      });

      setSearchResults(results);
      if (results.length > 0) {
        setShowResults(true);
      } else {
        setShowResults(false);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const q = searchValue.trim();
    if (q.length < 3) {
      setShowResults(false);
      setSearchResults([]);
      return;
    }
    await performSearch(q);
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
    <div className="map-overlay-center">
      <h1 className="text-5xl md:text-6xl font-bold mb-8 text-text dark:text-text-dark text-center">
        Pinpoint
      </h1>
      <div className="map-actions-container">
        <div className="map-topbar">
          <div className="map-coords">
            <div>
              Longitude: {center[0].toFixed(4)} | Latitude:{" "}
              {center[1].toFixed(4)}
            </div>
            <div>Zoom: {zoom.toFixed(2)}</div>
          </div>
          <button
            onClick={() => onFlyTo(MAP_DEFAULTS.center, MAP_DEFAULTS.zoom)}
            className="map-reset-button map-reset-button--small"
          >
            Reset
          </button>
        </div>

        <form onSubmit={handleSubmit} className="map-search-form">
          <div className="map-search-container">
            <input
              type="text"
              className="map-search-input"
              placeholder="Search for a location..."
              value={searchValue}
              onChange={handleSearchChange}
              aria-label="Search for a location"
            />
            <button
              type="submit"
              className="map-search-button"
              disabled={isSearching}
            >
              {isSearching ? "Searching…" : "Search"}
            </button>
          </div>
          {showResults && (
            <div className="max-h-40 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="flex">No results</div>
              ) : (
                searchResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    className="flex flex-col items-start hover:bg-gray-200 dark:hover:bg-slate-700 hover:cursor-pointer w-full p-2 rounded"
                    onClick={() => handleResultSelect(result)}
                  >
                    <div className="font-bold">{result.name}</div>
                    {(result.place_formatted || result.full_address) && (
                      <div className="text-left">
                        {result.place_formatted || result.full_address}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default MapActions;
