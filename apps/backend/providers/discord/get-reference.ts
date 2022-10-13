import { GetReferenceFn } from "../types";

const getReference: GetReferenceFn = (providerSentResponse, _) => {
  const sentData: {
    channelId: string;
    id: string;
  } =
    typeof providerSentResponse === "string"
      ? JSON.parse(providerSentResponse)
      : providerSentResponse;

  return {
    channelId: sentData.channelId,
    id: sentData.id,
  };
};

export default getReference;
