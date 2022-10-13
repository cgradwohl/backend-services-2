import { GetExternalIdFn } from "../types";

const getExternalId: GetExternalIdFn = (providerResponse: object) =>
  (providerResponse as { MessageID: string }).MessageID;

export default getExternalId;
