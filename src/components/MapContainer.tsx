"use client";

import { useRef, useEffect, useState } from "react";
import { useTheme } from "../hooks/useTheme";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapActions from "./MapActions";
import { getMapboxToken, MAP_DEFAULTS } from "../api/config";

// Globe defaults
const GLOBE_CENTER = MAP_DEFAULTS.center;
const GLOBE_ZOOM = MAP_DEFAULTS.zoom;

function MapContainer() {
  const mapRef = useRef<mapboxgl.Map>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [boundingBoxSource, setBoundingBoxSource] = useState<string | null>(
    null
  );

  const { theme } = useTheme();

  const [center, setCenter] = useState<[number, number]>(GLOBE_CENTER);
  const [zoom, setZoom] = useState<number>(GLOBE_ZOOM);

  useEffect(() => {
    // Note: NEXT_PUBLIC_ tokens are visible to clients by design
    try {
      mapboxgl.accessToken = getMapboxToken();
    } catch (error) {
      console.error("Failed to initialize Mapbox:", error);
      return;
    }

    if (mapContainerRef.current) {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: MAP_DEFAULTS.style,
        projection: MAP_DEFAULTS.projection,
        config: {
          basemap: {
            lightPreset: theme === "dark" ? "night" : "day",
          },
        },
        center: GLOBE_CENTER,
        zoom: GLOBE_ZOOM,
      });

      mapRef.current = map;

      // Default atmosphere
      map.on("style.load", () => {
        map.setFog({});
      });

      // Update state on move
      map.on("move", () => {
        // get the current center coordinates and zoom level from the map
        const mapCenter = map.getCenter();
        const mapZoom = map.getZoom();

        // update state
        setCenter([mapCenter.lng, mapCenter.lat]);
        setZoom(mapZoom);
      });

      // Auto-rotate the globe (spinning)
      const { secondsPerRevolution, maxSpinZoom, slowSpinZoom } =
        MAP_DEFAULTS.spinSettings;
      let userInteracting = false;
      let spinEnabled = true;

      function spinGlobe() {
        const zoom = map.getZoom();
        if (spinEnabled && !userInteracting && zoom < maxSpinZoom) {
          let distancePerSecond = 360 / secondsPerRevolution;
          if (zoom > slowSpinZoom) {
            const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
            distancePerSecond *= Math.max(zoomDif, 0);
          }
          const center = map.getCenter();
          center.lng -= distancePerSecond;
          map.easeTo({ center, duration: 1000, easing: (n) => n });
        }
      }

      // Pause spinning on interaction
      map.on("mousedown", () => {
        userInteracting = true;
      });
      // Restart spinning after interaction
      map.on("mouseup", () => {
        userInteracting = false;
        spinGlobe();
      });
      map.on("dragend", () => {
        userInteracting = false;
        spinGlobe();
      });
      map.on("pitchend", () => {
        userInteracting = false;
        spinGlobe();
      });
      map.on("rotateend", () => {
        userInteracting = false;
        spinGlobe();
      });
      // When animation ends, continue spinning
      map.on("moveend", () => {
        spinGlobe();
      });

      // kick it off
      spinGlobe();
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

  // Fly to a specific location
  const handleFlyTo = (coordinates: [number, number], newZoom?: number) => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: coordinates,
        zoom: newZoom || zoom,
      });
    }
  };

  const handleDisplayBoundingBox = (
    bbox: [number, number, number, number] | null
  ) => {
    const map = mapRef.current;
    if (!map) return;

    // remove existing bounding box if any
    if (boundingBoxSource) {
      if (map.getLayer("bbox-layer")) {
        map.removeLayer("bbox-layer");
      }
      if (map.getSource(boundingBoxSource)) {
        map.removeSource(boundingBoxSource);
      }
      setBoundingBoxSource(null);
    }

    if (bbox) {
      const sourceId = `bbox-source-${Date.now()}`;

      map.addSource(sourceId, {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [bbox[0], bbox[1]], // bottom left
                [bbox[2], bbox[1]], // bottom right
                [bbox[2], bbox[3]], // top right
                [bbox[0], bbox[3]], // top left
                [bbox[0], bbox[1]], // close
              ],
            ],
          },
          properties: {},
        },
      });

      // Add a layer to display the bounding box
      map.addLayer({
        id: "bbox-layer",
        type: "line",
        source: sourceId,
        layout: {},
        paint: {
          "line-color": "#0080ff",
          "line-width": 2,
        },
      });

      setBoundingBoxSource(sourceId);

      map.fitBounds(
        [
          [bbox[0], bbox[1]], // SW
          [bbox[2], bbox[3]], // NE
        ],
        {
          padding: 50,
        }
      );
    }
  };

  return (
    <div className="relative h-screen w-screen">
      <div id="map-container" ref={mapContainerRef} />

      <MapActions
        center={center}
        zoom={zoom}
        onFlyTo={handleFlyTo}
        onDisplayBoundingBox={handleDisplayBoundingBox}
      />
    </div>
  );
}

export default MapContainer;
