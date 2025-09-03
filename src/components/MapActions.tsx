"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

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
    setIsNavigating(true);
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
    <motion.div
      layoutId="map-actions-container"
      className={
        isNavigating
          ? "absolute top-5 left-5 w-80 max-w-[calc(100vw-2.5rem)] z-20"
          : "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] min-w-[90vw] sm:min-w-0 z-20"
      }
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 35,
      }}
    >
      <motion.h1
        layout
        className={
          isNavigating
            ? "text-2xl mb-4 text-accent dark:text-accent-dark cursor-pointer hover:opacity-80 font-bold text-center"
            : "text-5xl md:text-6xl mb-8 text-accent dark:text-accent-dark font-bold text-center"
        }
        onClick={() => isNavigating && setIsNavigating(false)}
        title={isNavigating ? "Click to return to center view" : ""}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 35,
        }}
      >
        Pinpoint
      </motion.h1>

      <motion.div
        layout
        className={
          isNavigating
            ? "z-10 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col gap-3 w-full"
            : "z-10 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col gap-3 w-full sm:max-w-lg md:max-w-xl"
        }
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 35,
        }}
      >
        <motion.div layout className="flex items-start justify-between gap-2">
          {/* <motion.div
            layout
            className={`
              text-sm text-gray-700 dark:text-accent-dark
              ${isNavigating ? "text-xs" : ""}
            `}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 35,
            }}
          >
            <div>
              Longitude: {center[0].toFixed(4)} | Latitude:{" "}
              {center[1].toFixed(4)}
            </div>
            <div>Zoom: {zoom.toFixed(2)}</div>
          </motion.div> */}
          <motion.div layout className="flex gap-1">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsNavigating(!isNavigating)}
              className="bg-gray-500 dark:bg-gray-600 text-white text-xs px-2 py-1 rounded shadow-sm hover:opacity-90 transition-opacity border-none cursor-pointer"
              title="Return to center view"
            >
              Switch
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onFlyTo(MAP_DEFAULTS.center, MAP_DEFAULTS.zoom);
                setIsNavigating(false);
              }}
              className="bg-secondary dark:bg-secondary-dark text-white dark:text-accent px-2 py-1 rounded-lg shadow-md hover:opacity-90 transition-opacity text-xs leading-4 border-none cursor-pointer"
            >
              Reset
            </motion.button>
          </motion.div>
        </motion.div>

        <motion.form
          layout
          onSubmit={handleSubmit}
          className="flex flex-col gap-2 relative"
        >
          <motion.div layout className="flex flex-col sm:flex-row gap-2">
            <motion.input
              layout
              layoutId="search-input"
              type="text"
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-accent-dark flex-grow outline-none focus:outline-2 focus:outline-primary dark:focus:outline-primary-dark focus:outline-offset-2"
              placeholder="Search for a location..."
              value={searchValue}
              onChange={handleSearchChange}
              aria-label="Search for a location"
            />
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="bg-primary dark:bg-primary-dark text-white dark:text-accent p-2 rounded-lg shadow-md hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity border-none cursor-pointer"
              disabled={isSearching}
            >
              {isSearching ? "Searching…" : "Search"}
            </motion.button>
          </motion.div>
          <AnimatePresence>
            {showResults && (
              <motion.div
                layout
                className="max-h-40 overflow-y-auto overflow-x-clip"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {searchResults.length === 0 ? (
                  <div className="flex justify-center p-2 text-gray-500 dark:text-gray-400">
                    No results
                  </div>
                ) : (
                  searchResults.map((result) => (
                    <motion.button
                      key={result.id}
                      type="button"
                      className="flex flex-col items-start w-full p-2 rounded bg-transparent border-none cursor-pointer text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => handleResultSelect(result)}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="font-bold text-gray-800 dark:text-accent-dark">
                        {result.name}
                      </div>
                      {(result.place_formatted || result.full_address) && (
                        <div className="text-left text-gray-500 dark:text-gray-400 text-sm">
                          {result.place_formatted || result.full_address}
                        </div>
                      )}
                    </motion.button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.form>
      </motion.div>
    </motion.div>
  );
}

export default MapActions;
