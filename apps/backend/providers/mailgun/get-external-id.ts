import { GetExternalIdFn } from "../types";

const getExternalId: GetExternalIdFn = (providerResponse: object) =>
  ((providerResponse as { id?: string })?.id ?? "").replace(/(<|>)/g, "");

export default getExternalId;
