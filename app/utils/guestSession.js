const GUEST_STORAGE_KEY = "khc_guest_id_v1";

const sanitizeGuestId = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 120);
};

const generateGuestId = () => {
  const randomPart = Math.random().toString(36).slice(2, 10);
  const timePart = Date.now().toString(36);
  return `khc_guest_${timePart}_${randomPart}`;
};

export const getGuestId = () => {
  if (typeof window === "undefined") return "";

  const existing = sanitizeGuestId(window.localStorage.getItem(GUEST_STORAGE_KEY));
  if (existing) return existing;

  const next = generateGuestId();
  window.localStorage.setItem(GUEST_STORAGE_KEY, next);
  return next;
};

export const getGuestRequestHeaders = () => {
  const guestid = getGuestId();
  return guestid ? { "x-guest-id": guestid } : {};
};
