import { GetExternalIdFn } from "../types";
import { MandrillSendResponse } from "./types";

const getExternalId: GetExternalIdFn = (providerResponse: object) => {
  const externalId = (providerResponse as { data: MandrillSendResponse })
    ?.data?.[0]?._id;

  if (!externalId) {
    console.warn(`Unable to find externalId ${externalId} in mandrill`);
  }
  return externalId;
};

export default getExternalId;
