"use client";

import { useMemo, useState } from "react";

const GEO_API_KEY =
  process.env.NEXT_PUBLIC_GEO_API ||
  process.env.VITE_GEO_API ||
  "";

const OPENCAGE_BASE = "https://api.opencagedata.com/geocode/v1/json";

const toLocationShape = (result) => {
  if (!result) return null;
  const components = result.components || {};
  const geometry = result.geometry || {};
  return {
    lat: Number(geometry.lat),
    lng: Number(geometry.lng),
    formatted: result.formatted || "",
    city:
      components.city ||
      components.town ||
      components.village ||
      components.county ||
      "",
    district: components.state_district || components.state || "",
    country: components.country || "",
    area: components.suburb || components.neighbourhood || "",
  };
};

const useGetMyLocation = () => {
  const [location, setLocation] = useState(null);
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);

  const hasGeoApi = useMemo(() => Boolean(GEO_API_KEY), []);

  const reverseGeocode = async (lat, lng) => {
    if (!hasGeoApi) {
      return {
        lat,
        lng,
        formatted: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        city: "",
        district: "",
        country: "",
        area: "",
      };
    }
    const url = `${OPENCAGE_BASE}?q=${encodeURIComponent(
      `${lat},${lng}`
    )}&key=${encodeURIComponent(GEO_API_KEY)}&no_annotations=1&limit=1`;
    const response = await fetch(url);
    const data = await response.json();
    return toLocationShape(data?.results?.[0]) || null;
  };

  const getMyLocation = async () => {
    setError("");
    setLoadingCurrent(true);
    try {
      if (!navigator?.geolocation) {
        throw new Error("Geolocation is not supported in this browser.");
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const lat = Number(position.coords.latitude);
      const lng = Number(position.coords.longitude);
      const resolved = await reverseGeocode(lat, lng);
      if (!resolved) {
        throw new Error("Could not resolve your location details.");
      }
      setLocation(resolved);
      return resolved;
    } catch (err) {
      setError(err?.message || "Could not get your location.");
      return null;
    } finally {
      setLoadingCurrent(false);
    }
  };

  const searchManualLocation = async (query) => {
    const clean = String(query || "").trim();
    if (!clean) {
      setResults([]);
      return [];
    }
    if (!hasGeoApi) {
      setError("Geo API key not found. Add NEXT_PUBLIC_GEO_API or VITE_GEO_API.");
      setResults([]);
      return [];
    }

    setError("");
    setSearching(true);
    try {
      const url = `${OPENCAGE_BASE}?q=${encodeURIComponent(
        clean
      )}&key=${encodeURIComponent(GEO_API_KEY)}&no_annotations=1&limit=5`;
      const response = await fetch(url);
      const data = await response.json();
      const parsed = Array.isArray(data?.results)
        ? data.results.map(toLocationShape).filter(Boolean)
        : [];
      setResults(parsed);
      return parsed;
    } catch (err) {
      setError("Could not search location right now.");
      setResults([]);
      return [];
    } finally {
      setSearching(false);
    }
  };

  const pickLocation = (picked) => {
    if (!picked) return;
    setLocation(picked);
    setResults([]);
    setError("");
  };

  return {
    location,
    loadingCurrent,
    searching,
    error,
    results,
    hasGeoApi,
    getMyLocation,
    searchManualLocation,
    pickLocation,
    setLocation,
  };
};

export default useGetMyLocation;

