"use client";

import { useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const LocationEvents = ({ onPick }) => {
  useMapEvents({
    click(e) {
      if (typeof onPick === "function") {
        onPick(e.latlng);
      }
    },
  });
  return null;
};

const LocationPickerMap = ({ lat, lng, onPick }) => {
  const center = useMemo(() => [lat || 23.8103, lng || 90.4125], [lat, lng]);

  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-200 shadow-sm">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom
        className="h-[260px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationEvents onPick={onPick} />
        <Marker position={center} icon={markerIcon} />
      </MapContainer>
    </div>
  );
};

export default LocationPickerMap;

