import { RouteNodeAddress } from "../types";

export const getParentRouteNodeAddress = (
  address: RouteNodeAddress
): RouteNodeAddress | undefined => {
  // Root does not have parent. Note that functions up the call stack rely on this behavior
  if (address.length === 0) {
    return undefined;
  }

  return address.slice(0, address.length - 1);
};
