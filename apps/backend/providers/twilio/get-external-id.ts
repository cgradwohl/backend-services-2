import { GetExternalIdFn } from "../types";
import { IMessage } from "./types";

const getExternalId: GetExternalIdFn = (providerResponse: object) =>
  (providerResponse as IMessage).sid;

export default getExternalId;
