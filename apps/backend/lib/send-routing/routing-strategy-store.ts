import jsonStore from "~/lib/s3";
import getEnvVar from "../get-environment-variable";
import NotFoundError from "../http-errors/not-found";
import { getMessageRoutingStrategyFilePath } from "./lib/routing-strategy-store-helpers";
import { RoutingStrategy } from "./types";

const BUCKET_ENV_NAME = "SEND_ROUTING_STRATEGY_BUCKET";

const defaultRouteStrategy: RoutingStrategy = {
  routing: {
    method: "single",
    channels: ["email"],
  },
  channels: {},
  providers: {},
};

export async function getSendRoutingStrategy({
  tenantId,
  strategyName = "default",
}: {
  tenantId: string;
  strategyName?: "default";
}): Promise<RoutingStrategy | undefined> {
  const { get } = jsonStore(getEnvVar(BUCKET_ENV_NAME));
  const filePath = getMessageRoutingStrategyFilePath(tenantId, strategyName);
  try {
    const json = (await get(filePath)) as Promise<RoutingStrategy>;
    return json;
  } catch (e) {
    if (e instanceof NotFoundError) {
      return defaultRouteStrategy;
    }

    throw e;
  }
}

export async function putSendRoutingStrategy({
  tenantId,
  strategy,
  strategyName = "default",
}: {
  tenantId: string;
  strategy: RoutingStrategy;
  strategyName?: "default";
}): Promise<void> {
  const { put } = jsonStore(getEnvVar(BUCKET_ENV_NAME));
  const filePath = getMessageRoutingStrategyFilePath(tenantId, strategyName);
  await put(filePath, strategy);
}
