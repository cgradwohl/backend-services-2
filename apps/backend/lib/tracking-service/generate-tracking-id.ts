import uuidAPIKey from "uuid-apikey";

export const generateTrackingId = () =>
  uuidAPIKey.create({ noDashes: true }).apiKey.toLowerCase();
