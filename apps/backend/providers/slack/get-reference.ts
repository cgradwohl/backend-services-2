import { GetReferenceFn } from "../types";

const getReference: GetReferenceFn = (providerSentResponse, _) => {
  const sentData: {
    channel: string;
    ts: string;
  } =
    typeof providerSentResponse === "string"
      ? JSON.parse(providerSentResponse)
      : providerSentResponse;

  return {
    channel: sentData?.channel,
    ts: sentData?.ts,
  };
};

export default getReference;
