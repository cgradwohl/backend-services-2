import { GetReferenceFn } from "../types";

const getReference: GetReferenceFn = (providerSentResponse, _) => {
  const sentData: {
    MessageID: string;
  } =
    typeof providerSentResponse === "string"
      ? JSON.parse(providerSentResponse)
      : providerSentResponse;

  return {
    MessageID: sentData ? sentData.MessageID : undefined,
  };
};

export default getReference;
