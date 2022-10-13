import { GetDeliveredTimestamp } from "../types";
import { IMandrillInfoResponse } from "./types";

const getDeliveredTimestamp: GetDeliveredTimestamp = (providerResponse) => {
  let result: { data: IMandrillInfoResponse };
  try {
    result =
      typeof providerResponse === "string"
        ? JSON.parse(providerResponse)
        : providerResponse;
  } catch (err) {
    return undefined;
  }

  const { smtp_events: events } = result.data;
  const deliveredEvent = events.find((e) => e.diag.startsWith("2"));

  return deliveredEvent.ts * 1000;
};

export default getDeliveredTimestamp;
