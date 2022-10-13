import { RouteBranch, RouteNode, RouteNodeAddress } from "../types";
import { getParentRouteNodeAddress } from "./get-parent-route-node-address";
import { getRouteNode } from "./get-route-node";

export const getParentRouteNode = (
  address: RouteNodeAddress,
  tree: RouteNode
): RouteBranch | undefined => {
  const parentAddress = getParentRouteNodeAddress(address);
  return parentAddress && (getRouteNode(parentAddress, tree) as RouteBranch);
};
