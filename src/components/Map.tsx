import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const INITIAL_COORDS: [number, number] = [-157.3637, 1.9827]; // banan
const INITIAL_ZOOM = 13;

function Map() {
  const mapRef = useRef<mapboxgl.Map>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [center, setCenter] = useState(INITIAL_COORDS);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);

  useEffect(() => {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

    if (mapContainerRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/standard",
        config: {
          basemap: {
            lightPreset: "night", // also day, set dark mode condition here too
          },
        },
        center: center,
        zoom: zoom,
      });

      mapRef.current.on("move", () => {
        // get the current center coordinates and zoom level from the map
        const mapCenter = mapRef.current!.getCenter();
        const mapZoom = mapRef.current!.getZoom();

        // update state
        setCenter([mapCenter.lng, mapCenter.lat]);
        setZoom(mapZoom);
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  const handleReset = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        // this is where i can pipe coordinates from external sources
        center: INITIAL_COORDS,
        zoom: INITIAL_ZOOM,
      });
    }
  };

  const handleBatman = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [41.1309, 37.8814],
        zoom: 11.5,
      });
    }
  };

  return (
    <div className="relative">
      <div id="coords">
        Longitude: {center[0].toFixed(4)} | Latitude: {center[1].toFixed(4)} |
        Zoom: {zoom.toFixed(2)}
      </div>
      <button className="place-btn-1 btn-secondary" onClick={handleReset}>
        Banana
      </button>
      <button className="place-btn-2 btn-secondary" onClick={handleBatman}>
        Batman
      </button>
      <div id="map-container" ref={mapContainerRef} />
    </div>
  );
}

export default Map;
