import {
  DeadRouteLeaf,
  RouteLeaf,
  RouteNode,
  RouteNodeAddress,
} from "../types";
import {
  getNextChildAddress,
  makeDeadRouteLeaf,
  makeRouteBranch,
  makeRouteLeaf,
} from "../generate-routing";
import { TemplateV1RouteNode, TemplateV1RoutingSummary } from "./types";

export const templateV1RoutingSummaryToTree = (
  summary: TemplateV1RoutingSummary
): RouteNode => {
  const root = makeRouteBranch({
    address: [],
    nodes: [],
  });

  for (const node of summary.always) {
    root.nodes.push(
      templateV1RouteNodeToLeaf({
        node,
        address: getNextChildAddress(root.address, root.nodes),
        providerFailoverIndex: 1,
      })
    );
  }

  root.nodes.push(
    makeBestOfTree({
      address: getNextChildAddress(root.address, root.nodes),
      bestOf: summary.bestOf,
    })
  );

  return root;
};

const makeBestOfTree = ({
  bestOf,
  address,
  providerFailoverIndex = 1,
}: {
  bestOf: TemplateV1RouteNode[];
  address: RouteNodeAddress;
  providerFailoverIndex?: number;
}): RouteNode => {
  const branch: RouteNode = makeRouteBranch({ address, nodes: [] });
  for (const [index, node] of bestOf.entries()) {
    const leaf = templateV1RouteNodeToLeaf({
      node,
      address: getNextChildAddress(address, branch.nodes),
      providerFailoverIndex,
    });
    branch.nodes.push(leaf);

    if (leaf.type === "dead-leaf") continue;

    const nextBestOf = bestOf.slice(index + 1);
    branch.failover =
      nextBestOf.length > 0
        ? makeBestOfTree({
            bestOf: nextBestOf,
            address: getNextChildAddress(address, "failover"),
            providerFailoverIndex: providerFailoverIndex + 1,
          })
        : undefined;

    break;
  }

  return branch;
};

const templateV1RouteNodeToLeaf = ({
  node,
  address,
  providerFailoverIndex,
}: {
  node: TemplateV1RouteNode;
  address: RouteNodeAddress;
  providerFailoverIndex: number;
}): RouteLeaf | DeadRouteLeaf => {
  if (!node.selected && !node.canUseForFailover) {
    return makeDeadRouteLeaf({
      address,
      channel: node.channel,
      provider: node.provider,
      failureType: "MISSING_PROVIDER_SUPPORT",
      failureReason: node.reason,
    });
  }

  return makeRouteLeaf({
    address,
    channel: node.channel,
    provider: node.provider,
    taxonomy: node.taxonomy,
    providerConfigurationId: node.configurationId,
    templateChannelId: node.id,
    providerFailoverIndex,
  });
};
