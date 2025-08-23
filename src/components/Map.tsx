"use client";

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

  const [boundingBoxSource, setBoundingBoxSource] = useState<string | null>(
    null
  );

  const { theme } = useTheme();

  const [center, setCenter] = useState<[number, number]>(INITIAL_COORDS);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

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
  }, [theme]);

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
    <div className="relative">
      <MapActions
        center={center}
        zoom={zoom}
        onFlyTo={handleFlyTo}
        onDisplayBoundingBox={handleDisplayBoundingBox}
      />
      <div id="map-container" ref={mapContainerRef} />
    </div>
  );
}

export default Map;
