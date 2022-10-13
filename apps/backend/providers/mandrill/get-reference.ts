import logger from "~/lib/logger";
import { GetReferenceFn } from "../types";
import { MandrillSendResponse } from "./types";

const getReference: GetReferenceFn = (providerSentResponse, _) => {
  logger.debug(
    "providerSentResponse",
    JSON.stringify(providerSentResponse, null, 2)
  );

  const sentData: { data: MandrillSendResponse } =
    typeof providerSentResponse === "string"
      ? JSON.parse(providerSentResponse)
      : providerSentResponse;

  return {
    _id: sentData?.data[0]?._id,
  };
};

export default getReference;
