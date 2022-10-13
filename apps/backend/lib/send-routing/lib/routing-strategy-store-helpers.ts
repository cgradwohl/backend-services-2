import { createMd5Hash } from "~/lib/crypto-helpers";
import { MessageRoutingStrategyFilePath } from "../types";

export function getMessageRoutingStrategyFilePath(
  tenantId: string,
  strategyName: "default" = "default"
): MessageRoutingStrategyFilePath {
  const hash = getRoutingStrategyPrefix(tenantId);
  return `${hash}/${tenantId}_${strategyName}_routing_strategy.json`;
}

export function getRoutingStrategyPrefix(tenantId: string): string {
  return createMd5Hash(tenantId).substr(0, 3);
}
