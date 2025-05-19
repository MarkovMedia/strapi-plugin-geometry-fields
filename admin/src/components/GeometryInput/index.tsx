import React, { useState, useEffect, useRef } from "react";
import {
  Field,
  FieldLabel,
  FieldHint,
  FieldError,
} from "@strapi/design-system/Field";
import { parse, stringify } from "wkt";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../../lib/Leaflet.Editable";
import "../../lib/Path.Drag";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import type { GeoJSON } from "geojson";

interface GeometryInputProps {
  name: string;
  value?: string;
  onChange: (value: string) => void;
  required: boolean;
  error: string;
  description: any;
  intlLabel: any;
  attribute: {
    options?: Record<string, unknown>;
  };
}

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function closePolygonRing(coords : number[]) {
  let newCoords = [...coords];
  const first = coords[0];

  const last = coords[coords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    newCoords.push([...first]);
    return newCoords;
  }

  return coords;
}

function normalizePolygonLatLngs(latlngs) {
  function toClosedRing(latlngArr) {
    const ring = latlngArr.map(({ lat, lng }) => [lng, lat]);
    return closeRing(ring);
  }

  // Case 1: [[[LatLng]]] — multipolygon
  if (Array.isArray(latlngs[0]) && Array.isArray(latlngs[0][0])) {
    return latlngs.map((polygon) => polygon.map(toClosedRing));
  }

  // Case 2: [[LatLng], [LatLng]] — polygon with holes
  if (Array.isArray(latlngs[0])) {
    return [[...latlngs.map(toClosedRing)]];
  }

  // Case 3: [LatLng] — simple polygon
  return [[[toClosedRing(latlngs)]]];
}

function closeRing(ring) {
  if (!ring || ring.length === 0) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];

  if (first[0] !== last[0] || first[1] !== last[1]) {
    return [...ring, first]; // close the ring
  }
  return ring;
}

const GeometryInput: React.FC<GeometryInputProps> = ({
  name,
  value,
  onChange,
  intlLabel,
  required,
  error,
  description,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const boundsFitted = useRef<boolean>(null);
  const mapId = `map-${name}`;
  const [localGeoJSON, setLocalGeoJSON] = useState<GeoJSON.Geometry | null>(
    null
  );
  const [center, setCenter] = useState<number[]>([0, 50]);
  const [zoom, setZoom] = useState<number>(3);
  let geojson: GeoJSON.Geometry | null = null;

  if (value === "null" || value === undefined) {
    geojson = null;
  } else {
    geojson = parse(JSON.parse(value));
  }

  useEffect(() => {
    const container = L.DomUtil.get(mapId);

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    if (container && container._leaflet_id) {
      container._leaflet_id = null;
    }

    if (container) {
      const map = L.map(container, {
        center: center,
        zoom: zoom,
        editable: true,
      });

      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      let updatedGeometries = [];
      const allBounds = [];

      if (geojson) {
        if (geojson.type === "GeometryCollection") {
          geojson.geometries.forEach((geometry, index) => {
            let layer;

            if (geometry.type === "Point") {
              const latlng = geometry.coordinates.slice().reverse();
              layer = L.marker(latlng, { draggable: true }).addTo(map);

              layer.on("dragend", () => {
                const pos = layer.getLatLng();
                updatedGeometries[index] = {
                  type: "Point",
                  coordinates: [pos.lng, pos.lat],
                };
                triggerUpdate(updatedGeometries, "GeometryCollection");
              });
              allBounds.push(L.latLngBounds(latlng, latlng));
            } else if (geometry.type === "LineString") {
              const latlngs = geometry.coordinates.map(([lng, lat]) => [
                lat,
                lng,
              ]);
              layer = L.polyline(latlngs).addTo(map);
              layer.enableEdit();

              layer.on("dragend", () => {
                const updatedGeoJSON = layer.toGeoJSON();
                updatedGeometries[index] = {
                  type: "LineString",
                  coordinates: updatedGeoJSON.geometry.coordinates,
                };
                triggerUpdate(updatedGeometries, "GeometryCollection");
              });

              layer.on("editable:vertex:dragend", () => {
                const coords = layer
                  .getLatLngs()
                  .map(({ lat, lng }) => [lng, lat]);
                updatedGeometries[index] = {
                  type: "LineString",
                  coordinates: coords,
                };
                triggerUpdate(updatedGeometries, "GeometryCollection");
              });
              allBounds.push(layer.getBounds());
            } else if (geometry.type === "Polygon") {
              const latlngs = geometry.coordinates[0].map(([lng, lat]) => [
                lat,
                lng,
              ]);
              layer = L.polygon(latlngs).addTo(map);
              layer.enableEdit();

              layer.on("dragend", () => {
                const updatedGeoJSON = layer.toGeoJSON();
                updatedGeometries[index] = {
                  type: "Polygon",
                  coordinates: updatedGeoJSON.geometry.coordinates,
                };

                triggerUpdate(updatedGeometries, "GeometryCollection");
              });

              layer.on("editable:vertex:dragend", () => {
                const coords = [
                  layer.getLatLngs()[0].map(({ lat, lng }) => [lng, lat]),
                ];
                const fixedCoords = closePolygonRing(coords);
                updatedGeometries[index] = {
                  type: "Polygon",
                  coordinates: fixedCoords,
                };

                triggerUpdate(updatedGeometries, "GeometryCollection");
              });
              allBounds.push(layer.getBounds());
            }

            updatedGeometries[index] = geometry;
          });
        } else if (geojson?.type === "Point") {
          const latlng = geojson.coordinates.slice().reverse();
          const layer = L.marker(latlng, { draggable: true }).addTo(map);

          layer.on("dragend", () => {
            const pos = layer.getLatLng();
            const updatedGeoJSON = {
              type: "Point",
              coordinates: [pos.lng, pos.lat],
            };
            triggerUpdate(updatedGeoJSON, "Point");
          });
          allBounds.push(L.latLngBounds(latlng, latlng));
        } else if (geojson.type === "MultiPoint") {
          const layers = geojson.coordinates.map((point, idx) => {
            const latlng = point.slice().reverse();

            const layer = L.marker(latlng, { draggable: true }).addTo(map);
            layer.enableEdit();

            layer.on("dragend", () => {
              const pos = layer.getLatLng();
              geojson.coordinates[idx] = [pos.lng, pos.lat];
              triggerUpdate(geojson, "MultiPoint");
            });
            allBounds.push(L.latLngBounds(latlng, latlng));
            return layer;
          });
        } else if (geojson?.type === "LineString") {
          const latlngs = geojson.coordinates.map(([lng, lat]) => [lat, lng]);
          const layer = L.polyline(latlngs).addTo(map);
          layer.enableEdit();
          layer.on("dragend", () => {
            const updatedGeoJSON = layer.toGeoJSON();
            triggerUpdate(updatedGeoJSON, "LineString");
          });

          layer.on("editable:vertex:dragend", () => {
            const coords = layer.getLatLngs().map(({ lat, lng }) => [lng, lat]);
            const updatedGeoJSON = {
              type: "LineString",
              coordinates: coords,
            };

            triggerUpdate(updatedGeoJSON, "LineString");
          });

          allBounds.push(layer.getBounds());
        } else if (geojson.type === "MultiLineString") {
          const layers = geojson.coordinates.map((lineCoords, idx) => {
            const latlngs = lineCoords.map(([lng, lat]) => [lat, lng]);
            const layer = L.polyline(latlngs).addTo(map);
            layer.enableEdit();

            // Handle full line drag (not just vertex)
            layer.on("editable:dragend", () => {
              const updatedCoords = layer
                .getLatLngs()
                .map(({ lat, lng }) => [lng, lat]);
              geojson.coordinates[idx] = updatedCoords;
              triggerUpdate(geojson, "MultiLineString");
            });

            // Handle vertex drag
            layer.on("editable:vertex:dragend", () => {
              const updatedCoords = layer
                .getLatLngs()
                .map(({ lat, lng }) => [lng, lat]);
              geojson.coordinates[idx] = updatedCoords;
              triggerUpdate(geojson, "MultiLineString");
            });

            allBounds.push(layer.getBounds());
            return layer;
          });
        } else if (geojson?.type === "Polygon") {
          const latlngs = geojson.coordinates[0].map(([lng, lat]) => [
            lat,
            lng,
          ]);
          const layer = L.polygon(latlngs).addTo(map);
          layer.enableEdit();

          layer.on("dragend", () => {
            const updatedGeoJSON = layer.toGeoJSON();
            triggerUpdate(updatedGeoJSON, "Polygon");
          });

          layer.on("editable:vertex:dragend", () => {
            const coords = [
              layer.getLatLngs()[0].map(({ lat, lng }) => [lng, lat]),
            ];
            const fixedCoords = closePolygonRing(coords[0]);

            const updatedGeoJSON = {
              type: "Polygon",
              coordinates: [fixedCoords],
            };

            triggerUpdate(updatedGeoJSON, "Polygon");
          });

          allBounds.push(layer.getBounds());
        } else if (geojson.type === "MultiPolygon") {
          const layers = geojson.coordinates.map((polygonCoords, idx) => {
            const latlngs = polygonCoords.map((ring) =>
              ring.map(([lng, lat]) => [lat, lng])
            );

            const layer = L.polygon(latlngs).addTo(map);
            layer.enableEdit();

            layer.on("editable:dragend", () => {
              const latlngs = layer.getLatLngs();
              geojson.coordinates[idx] = normalizePolygonLatLngs(latlngs)[0]; // just one polygon
              triggerUpdate(geojson, "MultiPolygon");
            });

            layer.on("editable:vertex:dragend", () => {
              const latlngs = layer.getLatLngs();
              geojson.coordinates[idx] = normalizePolygonLatLngs(latlngs)[0];
              triggerUpdate(geojson, "MultiPolygon");
            });

            allBounds.push(layer.getBounds());
            return layer;
          });
        }

        if (!boundsFitted.current && allBounds.length) {
          const combinedBounds = allBounds.reduce(
            (acc, b) => acc.extend(b),
            allBounds[0]
          );
          map.fitBounds(combinedBounds, { padding: [20, 20] });
          boundsFitted.current = true;
        }
      }

      const triggerUpdate = (
        geom: GeoJSON.Geometry,
        type:
          | "GeometryCollection"
          | "Point"
          | "LineString"
          | "MultiLineString"
          | "Polygon"
          | "MultiPolygon"
      ) => {

        setCenter(mapRef.current.getCenter());
        setZoom(mapRef.current.getZoom());
        setLocalGeoJSON(geom);

        const toWkt = stringify(
          type === "GeometryCollection"
            ? { type: "GeometryCollection", geometries: geom as any }
            : geom
        );

        onChange({ target: { name, value: JSON.stringify(toWkt) } });
      };
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [localGeoJSON]);

  return (
    <Field
      name={name}
      hint={description?.defaultMessage}
      error={error}
      id={`map-wrapper-${name}`}
    >
      <FieldLabel required={required}>
        {intlLabel?.defaultMessage || name}
      </FieldLabel>
      <div
        id={`map-${name}`}
        style={{ height: "500px", borderRadius: "4px", overflow: "hidden" }}
      />
      <FieldHint />
      <FieldError />
    </Field>
  );
};

export default GeometryInput;
