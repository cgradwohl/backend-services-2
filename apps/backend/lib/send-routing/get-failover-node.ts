import { getAllRouteLeafs, getParentRouteNode } from "./lib";
import { RouteNode, RouteNodeAddress } from "./types";
import { arraysEqual } from "~/lib/utils";

/** Finds the correct failover strategy when the supplied address failed. */
export const getFailoverRouteNode = (opts: {
  failedAddress: RouteNodeAddress;

  /**
   * A list of every known failed address. Including failedAddress. Used to handle Fred scenarios
   * (see failover.spec.md) and timeouts.
   *
   * If the failed address is in a failover branch we infer all siblings of that failover branch
   * to be failed as well. However, in order to handle the Fred scenario, in the future we will
   * need to track the state of each node. Once this happens we can safely remove the inference
   * logic.
   */
  allFailedNodes: RouteNodeAddress[];
  tree: RouteNode;
}): GetFailoverNodeResult => {
  const { failedAddress, allFailedNodes, tree } = opts;
  const parent = getParentRouteNode(failedAddress, tree);
  if (!parent) return "failover-strategies-exhausted";

  const allSiblingsHaveFailed =
    // We know all siblings have failed if our current address is a failover branch, otherwise we wouldn't be here in the first place.
    failedAddress[failedAddress.length - 1] === "failover" ||
    // If we are not failover branch we need to make sure that all of our siblings have also failed.
    allLeafsAreInArray(parent, allFailedNodes);

  if (!allSiblingsHaveFailed) return "sibling-routes-may-not-have-failed";

  const failover = parent.failover;
  if (!failover || arraysEqual(failover.address, failedAddress)) {
    return getFailoverRouteNode({
      failedAddress: parent.address,
      allFailedNodes: [
        ...allFailedNodes,
        // Because some failed nodes are currently inferred (see allSiblingsHaveFailed assignment)
        // We have to add all the siblings to this list. For now.
        ...getAllRouteLeafs(parent).map((l) => l.address),
      ],
      tree,
    });
  }

  // In the event of a channel timeout some leafs may have failed before use
  if (allLeafsAreInArray(failover, allFailedNodes)) {
    return getFailoverRouteNode({
      failedAddress: failover.address,
      allFailedNodes,
      tree,
    });
  }

  return failover;
};

export type GetFailoverNodeResult =
  | RouteNode
  | "failover-strategies-exhausted"
  | "sibling-routes-may-not-have-failed";

/** Returns true if every leaf of the passed node is listed in the passed addresses list */
const allLeafsAreInArray = (
  node: RouteNode,
  list: RouteNodeAddress[]
): boolean => {
  if (node.type === "branch") {
    return node.nodes
      .filter((n) => n.type !== "dead-branch" && n.type !== "dead-leaf")
      .every((n) => allLeafsAreInArray(n, list));
  }

  return list.some((address) => arraysEqual(node.address, address));
};
