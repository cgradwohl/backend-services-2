import { GetReferenceFn } from "../types";

const getReference: GetReferenceFn = (providerSentResponse, _) => {
  const sentData: {
    id: string;
  } =
    typeof providerSentResponse === "string"
      ? JSON.parse(providerSentResponse)
      : providerSentResponse;

  return {
    id: sentData ? sentData.id : undefined,
  };
};

export default getReference;
