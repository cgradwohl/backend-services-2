import { createUnroutableEvent } from "~/lib/dynamo/event-logs";
import {
  RouteLeaf,
  RouteNode,
  RouteNodeAddress,
  SendTimes,
  setSendTimesForLeafs,
  getAllRouteLeafs,
  getFailoverRouteNode,
  RouteTimeoutTable,
  getTimedOutLeafs,
  GetFailoverNodeResult,
} from "~/lib/send-routing";
import { renderService } from "~/send/service";
import { IRenderProviderPayload } from "~/send/types";

export async function dispatchRouteTreeToRenderService({
  contextFilePath,
  dryRunKey,
  messageFilePath,
  messageId,
  requestId,
  routingTree,
  tenantId,
  times: baseTimes,
  failedAddress,
  timeouts,
}: {
  contextFilePath: string;
  dryRunKey: string;
  messageFilePath: string;
  messageId: string;
  requestId: string;
  routingTree: RouteNode;
  tenantId: string;
  times?: SendTimes;
  failedAddress?: RouteNodeAddress;
  timeouts?: RouteTimeoutTable;
}) {
  const branch = getBranch({
    tree: routingTree,
    failedAddress,
    times: baseTimes,
    timeouts,
  });

  if (typeof branch === "string") {
    await handleFailoverResult({ result: branch, tenantId, messageId });
    return;
  }

  // We send to all leafs of the current branch (Remember, branches are like a recursive send to all)
  const leafs = getAllRouteLeafs(branch);

  // See [1]
  const times = setSendTimesForLeafs(leafs, baseTimes);

  const leafMapper = (leaf: RouteLeaf): IRenderProviderPayload => ({
    command: "render",
    channel: leaf.channel,
    channelId: leaf.templateChannelId,
    contextFilePath: contextFilePath,
    dryRunKey,
    messageId,
    messageFilePath,
    configurationId: leaf.providerConfigurationId!,
    requestId,
    tenantId,
    address: leaf.address,
    times,
    shouldVerifyRequestTranslation: false,
    translated: false,
  });

  const dispatches = leafs
    .map(leafMapper)
    .map((payload) => renderService(tenantId).emit(payload));

  await Promise.all(dispatches);
}

function getBranch(opts: {
  tree: RouteNode;
  failedAddress?: RouteNodeAddress;
  times?: SendTimes;
  timeouts?: RouteTimeoutTable;
}): GetFailoverNodeResult {
  const { tree, failedAddress, times, timeouts } = opts;
  if (!failedAddress || !times || !timeouts) {
    return tree;
  }

  const allFailedNodes = [
    failedAddress,
    ...getTimedOutLeafs({ tree, times, timeouts }).map((l) => l.address),
  ];

  return getFailoverRouteNode({ tree, failedAddress, allFailedNodes });
}

async function handleFailoverResult({
  result,
  tenantId,
  messageId,
}: {
  result: GetFailoverNodeResult;
  tenantId: string;
  messageId: string;
}) {
  if (typeof result !== "string") {
    return;
  }

  if (result === "failover-strategies-exhausted") {
    await createUnroutableEvent(
      tenantId,
      messageId,
      "FAILED",
      "All failover options for send have been exhausted."
    );
  }

  if (result === "sibling-routes-may-not-have-failed") {
    await createUnroutableEvent(
      tenantId,
      messageId,
      "BOUNCED",
      "Cannot failover when status of sibling provider sends is unknown."
    );
  }
}

// [1] The times table is inherently forked each time route is invoked. This means that
// two independent failover strategies will create two times tables.
