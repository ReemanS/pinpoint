import { useState } from "react";

interface MapActionsProps {
  center: [number, number];
  zoom: number;
}

function MapActions({ center, zoom }: MapActionsProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Search functionality
    console.log("Searching for:", searchQuery);
  };

  return (
    <div className="map-actions-container">
      <div className="map-coords">
        <div>
          Longitude: {center[0].toFixed(4)} | Latitude: {center[1].toFixed(4)}
        </div>
        <div>Zoom: {zoom.toFixed(2)}</div>
      </div>

      <form onSubmit={handleSearch} className="map-search-form">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search location..."
          className="map-search-input"
        />
        <button type="submit" className="map-search-button">
          Search
        </button>
      </form>
    </div>
  );
}

export default MapActions;
