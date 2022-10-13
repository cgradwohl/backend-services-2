export const STS_MAX_AGE = Math.floor(365 * 24 * 60 * 60); // one year

const REQUIRED_SECURITY_HEADERS = {
  "Strict-Transport-Security": `max-age=${STS_MAX_AGE};includeSubDomains;preload`,
  "X-Content-Type-Options": "nosniff",
};

export default REQUIRED_SECURITY_HEADERS;
