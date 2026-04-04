import { getGuestRequestHeaders } from "./guestSession";

export const getRequestConfig = (extra = {}) => {
  const baseHeaders = getGuestRequestHeaders();
  const extraHeaders = extra?.headers || {};

  return {
    withCredentials: true,
    ...extra,
    headers: {
      ...baseHeaders,
      ...extraHeaders,
    },
  };
};
