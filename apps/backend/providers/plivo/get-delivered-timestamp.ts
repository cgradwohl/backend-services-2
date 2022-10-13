import { IMessage } from "./types";

const getDeliveredTimestamp = (providerResponse: object) => {
  const { data }: { data: IMessage } =
    typeof providerResponse === "string"
      ? JSON.parse(providerResponse)
      : providerResponse;

  return data.message_state === "delivered"
    ? new Date(data.message_time).getTime()
    : undefined;
};

export default getDeliveredTimestamp;
