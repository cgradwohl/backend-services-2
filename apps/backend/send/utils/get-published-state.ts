import { TenantScope } from "~/types.internal";
import { PublishedState } from "../types";

const getPublishedState = (scope: TenantScope) => {
  const [state] = scope?.split("/") ?? ["published"];
  return state as PublishedState;
};

export default getPublishedState;
