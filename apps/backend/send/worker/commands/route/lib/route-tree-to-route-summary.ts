import {
  RouteNode,
  getAllRouteLeafs,
  RoutingSummary,
} from "~/lib/send-routing";

export const routeTreeToRouteSummary = (tree?: RouteNode): RoutingSummary[] => {
  if (!tree) return [];

  return getAllRouteLeafs(tree, { includeDeadLeafs: true }).map(
    (leaf): RoutingSummary => {
      if (leaf.type === "dead-leaf") {
        return {
          channel: leaf.channel,
          provider: leaf.provider,
          reason: leaf.failureReason,
          type: leaf.failureType,
          selected: false,
        };
      }

      if (leaf.type === "dead-branch") {
        return {
          channel: leaf.channel,
          reason: leaf.failureReason,
          type: leaf.failureType,
          selected: false,
        };
      }

      return {
        channel: leaf.channel,
        provider: leaf.provider,
        taxonomy: leaf.taxonomy,
        configurationId: leaf.providerConfigurationId,
        selected: true,
        id: leaf.templateChannelId,
      };
    }
  );
};
