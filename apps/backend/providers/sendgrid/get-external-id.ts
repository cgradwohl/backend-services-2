import { GetExternalIdFn } from "../types";

const getExternalId: GetExternalIdFn = (providerResponse: object) =>
  providerResponse["courier-tracking-id"];

export default getExternalId;
