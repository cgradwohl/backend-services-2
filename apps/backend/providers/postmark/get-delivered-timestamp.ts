import { GetDeliveredTimestamp } from "../types";
import { IPostmarkMessageDetails } from "./types";

const getDeliveredTimestamp: GetDeliveredTimestamp = providerResponse => {
  let result: { data: IPostmarkMessageDetails };
  try {
    result =
      typeof providerResponse === "string"
        ? JSON.parse(providerResponse)
        : providerResponse;
  } catch (err) {
    return undefined;
  }

  const deliveredEvent = result.data.MessageEvents.find(
    ({ Type }) => Type === "Delivered"
  );

  return deliveredEvent
    ? new Date(deliveredEvent.ReceivedAt).getTime()
    : undefined;
};

export default getDeliveredTimestamp;
