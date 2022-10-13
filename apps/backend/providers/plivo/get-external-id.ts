import { GetExternalIdFn } from "../types";
import { IResponse } from "./types";

const getExternalId: GetExternalIdFn = (providerResponse: object) =>
  (providerResponse as IResponse)?.messageUuid[0];

export default getExternalId;
