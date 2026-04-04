"use client";

import axios from "axios";
import { serverurl } from "./constants/serverurl";

const RECO_SESSION_KEY = "khc-reco-session-key-v1";

const toSafeString = (value) => (value == null ? "" : String(value).trim());

export const getRecommendationSessionKey = () => {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(RECO_SESSION_KEY);
  if (existing) return existing;

  const next = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(RECO_SESSION_KEY, next);
  return next;
};

export const trackRecommendationEvent = async (payload = {}) => {
  const eventtype = toSafeString(payload.eventtype).toLowerCase();
  const slug = toSafeString(payload.slug);
  const productid = toSafeString(payload.productid);

  if (!eventtype || (!slug && !productid)) return;

  try {
    await axios.post(
      `${serverurl}/recommendation/track`,
      {
        eventtype,
        slug,
        productid,
        dwellseconds: Number(payload.dwellseconds || 0),
        quantity: Number(payload.quantity || 1),
        sessionkey: getRecommendationSessionKey(),
      },
      {
        withCredentials: true,
        timeout: 10000,
      }
    );
  } catch (_error) {
    // Silent on purpose. Recommendation tracking should never block UX.
  }
};
