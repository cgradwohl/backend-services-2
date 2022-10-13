import { IMessage } from "./types";

const getDeliveredTimestamp = (providerResponse: object) => {
  const { data }: { data: IMessage } =
    typeof providerResponse === "string"
      ? JSON.parse(providerResponse)
      : providerResponse;

  return data.status === "delivered"
    ? new Date(data.date_updated).getTime()
    : undefined;
};

export default getDeliveredTimestamp;
