import { GetDeliveredTimestamp } from "../types";

const getDeliveredTimestamp: GetDeliveredTimestamp = (providerResponse) => {
  const response =
    typeof providerResponse === "string"
      ? JSON.parse(providerResponse)
      : providerResponse;

  return new Date(response.editedTimestamp ?? response.timestamp).getTime();
};

export default getDeliveredTimestamp;
