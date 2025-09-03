"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { searchLocations } from "@/services/mapbox";
import { MAP_DEFAULTS } from "@/services/mapbox/config";
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
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 w-full max-w-[500px] min-w-[90vw] sm:min-w-0">
      <h1 className="text-5xl md:text-6xl font-bold mb-8 text-text dark:text-text-dark text-center">
        Pinpoint
      </h1>
      <div className="z-10 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col gap-3 w-full sm:max-w-lg md:max-w-xl">
        <div className="flex items-start justify-between gap-2">
          <div className="text-sm text-gray-700 dark:text-text-dark">
            <div>
              Longitude: {center[0].toFixed(4)} | Latitude:{" "}
              {center[1].toFixed(4)}
            </div>
            <div>Zoom: {zoom.toFixed(2)}</div>
          </div>
          <button
            onClick={() => onFlyTo(MAP_DEFAULTS.center, MAP_DEFAULTS.zoom)}
            className="bg-secondary dark:bg-secondary-dark text-white dark:text-accent px-2 py-1 rounded-lg shadow-md hover:opacity-90 transition-opacity text-xs leading-4 border-none cursor-pointer"
          >
            Reset
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2 relative">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-accent-dark flex-grow outline-none focus:outline-2 focus:outline-primary dark:focus:outline-primary-dark focus:outline-offset-2"
              placeholder="Search for a location..."
              value={searchValue}
              onChange={handleSearchChange}
              aria-label="Search for a location"
            />
            <button
              type="submit"
              className="bg-primary dark:bg-primary-dark text-white dark:text-accent p-2 rounded-lg shadow-md hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity border-none cursor-pointer"
              disabled={isSearching}
            >
              {isSearching ? "Searching…" : "Search"}
            </button>
          </div>
          {showResults && (
            <div className="max-h-40 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="flex justify-center p-2 text-gray-500 dark:text-gray-400">
                  No results
                </div>
              ) : (
                searchResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    className="flex flex-col items-start w-full p-2 rounded bg-transparent border-none cursor-pointer text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleResultSelect(result)}
                  >
                    <div className="font-bold text-gray-800 dark:text-accent-dark">
                      {result.name}
                    </div>
                    {(result.place_formatted || result.full_address) && (
                      <div className="text-left text-gray-500 dark:text-gray-400 text-sm">
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
