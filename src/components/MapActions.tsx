// MapActions: small control panel that shows coords/zoom, a submit-only
// Mapbox Geocoder input, and a compact reset button. Selecting a result
// flies the map to that location.
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Geocoder } from "@mapbox/search-js-react";

interface MapActionsProps {
  center: [number, number];
  zoom: number;
  onFlyTo: (coordinates: [number, number], zoom?: number) => void;
}

function MapActions({ center, zoom, onFlyTo }: MapActionsProps) {
  const [searchValue, setSearchValue] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // i had to cast Geocoder to any just to make it useable
  // maybe i'll stick with the raw APIs next time instead of this wrapper
  const GeocoderAny = Geocoder as any;
  const geocoderRef = useRef<any>(null);

  // Gate to prevent network calls while typing. We only allow the next search
  // when the user explicitly submits the form.
  const allowNextSearch = useRef<boolean>(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!geocoderRef.current) return;
    if (searchValue.trim().length < 3) return;
    setIsSearching(true);
    allowNextSearch.current = true;
    try {
      geocoderRef.current.search(searchValue);
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
    const name =
      feature?.properties?.name ||
      feature?.properties?.place_formatted ||
      feature?.properties?.full_address ||
      "";
    if (name) setSearchValue(name);
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
