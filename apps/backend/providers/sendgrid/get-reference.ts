import { GetReferenceFn } from "../types";

const getReference: GetReferenceFn = (
  providerSentResponse,
  providerDeliveredResponse
) => {
  const sentData: {
    "courier-tracking-id": string;
    "x-message-id": string;
  } =
    typeof providerSentResponse === "string"
      ? JSON.parse(providerSentResponse)
      : providerSentResponse;
  const deliveredData: {
    data: {
      messages: [
        {
          msg_id: string;
        }
      ];
    };
  } =
    providerDeliveredResponse &&
    (typeof providerDeliveredResponse === "string"
      ? JSON.parse(providerDeliveredResponse)
      : providerDeliveredResponse);

  return {
    "courier-tracking-id": sentData
      ? sentData["courier-tracking-id"]
      : undefined,
    // https://sendgrid.com/docs/glossary/message-id/
    message_id: deliveredData
      ? deliveredData.data.messages[0].msg_id
      : undefined,
    // https://sendgrid.com/docs/glossary/x-message-id/
    "x-message-id": sentData ? sentData["x-message-id"] : undefined,
  };
};

export default getReference;
