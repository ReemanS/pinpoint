"use client";

import { useRef, useEffect, useState } from "react";
import { useTheme } from "../hooks/useTheme";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapActions from "./MapActions";

// Globe defaults
const GLOBE_CENTER: [number, number] = [0, 0];
const GLOBE_ZOOM = 1.5;

function MapContainer() {
  const mapRef = useRef<mapboxgl.Map>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [boundingBoxSource, setBoundingBoxSource] = useState<string | null>(
    null
  );

  const { theme } = useTheme();

  const [center, setCenter] = useState<[number, number]>(GLOBE_CENTER);
  const [zoom, setZoom] = useState(GLOBE_ZOOM);

  useEffect(() => {
    // Note: NEXT_PUBLIC_ tokens are visible to clients by design
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

    if (mapContainerRef.current) {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/standard",
        projection: "globe",
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
      const secondsPerRevolution = 120; // complete revolution every 2 minutes
      const maxSpinZoom = 4; // stop spinning when zoomed in
      const slowSpinZoom = 3; // slow down spin between 3-4
      let userInteracting = false;
      let spinEnabled = true;

      function spinGlobe() {
        const z = map.getZoom();
        if (spinEnabled && !userInteracting && z < maxSpinZoom) {
          let distancePerSecond = 360 / secondsPerRevolution;
          if (z > slowSpinZoom) {
            const zoomDif = (maxSpinZoom - z) / (maxSpinZoom - slowSpinZoom);
            distancePerSecond *= Math.max(zoomDif, 0);
          }
          const c = map.getCenter();
          c.lng -= distancePerSecond;
          map.easeTo({ center: c, duration: 1000, easing: (n) => n });
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
