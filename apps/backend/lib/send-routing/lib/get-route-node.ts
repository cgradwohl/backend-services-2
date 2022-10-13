import { RouteNode, RouteNodeAddress } from "../types";

export const getRouteNode = (
  address: RouteNodeAddress,
  startNode?: RouteNode
): RouteNode | undefined => {
  if (address.length === 0) {
    return startNode;
  }

  if (!startNode || startNode.type !== "branch") {
    return undefined;
  }

  const index = address[0];
  const nextAddress = address.slice(1);
  const nextNode =
    index === "failover" ? startNode.failover : startNode.nodes[index];

  return getRouteNode(nextAddress, nextNode);
};
