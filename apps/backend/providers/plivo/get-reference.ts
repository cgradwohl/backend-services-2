import { GetReferenceFn } from "../types";
import { IMessage, IResponse } from "./types";

function assertIsMessage(data: object): data is { data: IMessage } {
  return "data" in data;
}

function assertIsResponse(data: object): data is IResponse {
  return "messageUuid" in data;
}

const getReference: GetReferenceFn = (providerSentResponse) => {
  const sentData: object =
    typeof providerSentResponse === "string"
      ? JSON.parse(providerSentResponse)
      : providerSentResponse;

  if (!sentData) {
    return {
      messageUuid: undefined,
    };
  }

  if (assertIsMessage(sentData)) {
    return {
      messageUuid: sentData?.data?.message_uuid,
    };
  }

  if (assertIsResponse(sentData)) {
    return {
      messageUuid: sentData?.messageUuid?.[0],
    };
  }
};

export default getReference;
