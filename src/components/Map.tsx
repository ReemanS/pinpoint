import { useRef, useEffect, useState } from "react";
import { useTheme } from "../hooks/useTheme";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapActions from "./MapActions";

const INITIAL_COORDS: [number, number] = [-157.3637, 1.9827]; // banan
const INITIAL_ZOOM = 13;

function Map() {
  const mapRef = useRef<mapboxgl.Map>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const { theme } = useTheme();

  const [center, setCenter] = useState<[number, number]>(INITIAL_COORDS);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);

  useEffect(() => {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

    if (mapContainerRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/standard",
        config: {
          basemap: {
            lightPreset: theme === "dark" ? "night" : "day",
          },
        },
        center: INITIAL_COORDS,
        zoom: INITIAL_ZOOM,
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

  // update only the lightPreset when theme changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setConfigProperty(
        "basemap",
        "lightPreset",
        theme === "dark" ? "night" : "day"
      );
    }
  }, [theme]);

  // Function to fly to a specific location
  const handleFlyTo = (coordinates: [number, number], newZoom?: number) => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: coordinates,
        zoom: newZoom || zoom,
      });
    }
  };

  return (
    <div className="relative">
      <MapActions center={center} zoom={zoom} onFlyTo={handleFlyTo} />
      <div id="map-container" ref={mapContainerRef} />
    </div>
  );
}

export default Map;
