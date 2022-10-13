import { createMd5Hash } from "../crypto-helpers";

export const generateMd5Prefix = (
  max_length: number,
  eventId: string
): string => {
  return createMd5Hash(eventId).substring(0, max_length);
};
