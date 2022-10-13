import { GetReferenceFn } from "../types";
import { IMessage } from "./types";

const getReference: GetReferenceFn = (providerSentResponse, _) => {
  const sentData: IMessage =
    typeof providerSentResponse === "string"
      ? JSON.parse(providerSentResponse)
      : providerSentResponse;

  return {
    sid: sentData ? sentData.sid : undefined,
  };
};

export default getReference;
