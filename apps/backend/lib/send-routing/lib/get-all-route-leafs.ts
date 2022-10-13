import { DeadRouteBranch, DeadRouteLeaf, RouteLeaf, RouteNode } from "../types";

export interface GetAllRouteLeafsOpts {
  includeFailoverBranches?: boolean;
  includeDeadLeafs?: boolean;
}

export interface GetAllRouteLeafsWithDeadLeafsOpts
  extends GetAllRouteLeafsOpts {
  includeDeadLeafs: true;
}

export function getAllRouteLeafs(
  tree: RouteNode,
  opts: GetAllRouteLeafsWithDeadLeafsOpts
): (RouteLeaf | DeadRouteLeaf | DeadRouteBranch)[];
export function getAllRouteLeafs(
  tree: RouteNode,
  opts?: GetAllRouteLeafsOpts
): RouteLeaf[];
export function getAllRouteLeafs(
  tree: RouteNode,
  opts?: GetAllRouteLeafsOpts
): (RouteLeaf | DeadRouteLeaf | DeadRouteBranch)[] {
  if (tree.type === "branch") {
    return [
      ...tree.nodes.flatMap((n) => getAllRouteLeafs(n, opts)),
      ...(opts?.includeFailoverBranches && tree.failover
        ? getAllRouteLeafs(tree.failover, opts)
        : []),
    ];
  }

  if (tree.type === "leaf") {
    return [tree];
  }

  if (
    opts?.includeDeadLeafs &&
    (tree.type === "dead-leaf" || tree.type === "dead-branch")
  ) {
    return [tree];
  }

  return [];
}
