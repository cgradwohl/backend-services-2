// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");
import { Block, KnownBlock } from "@slack/web-api";

import { IVariableHandler } from "~/lib/variable-handler";

import { getSlackBotProfile, slackBotSend } from "./bot";
import { getSlackWebhookFromProfile, slackWebhookSend } from "./webhook";

import { DeliveryHandler } from "../types";

export interface ISlackMessage {
  blocks: Array<KnownBlock | Block>;
  text: string;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
}

const getTs = (tsPath: string, variableHandler: IVariableHandler) => {
  const resolved = variableHandler.resolve(tsPath, undefined);

  if (!resolved) {
    return;
  }

  if (Array.isArray(resolved)) {
    return resolved[0];
  }

  return resolved;
};

const send: DeliveryHandler = async (
  { override, slackConfig = {}, variableHandler },
  { slackBlocks: blocks, text }
) => {
  const { profile } = variableHandler.getRootValue();
  const { tsPath } = slackConfig;
  const ts = tsPath ? getTs(tsPath, variableHandler) : undefined;

  let message: ISlackMessage = {
    blocks,
    text,
  };

  if (override && override.body) {
    message = jsonMerger.mergeObjects([message, override.body]);
  }

  const slackBotProfile = getSlackBotProfile(profile);
  if (slackBotProfile) {
    return slackBotSend(slackBotProfile, message, ts, {
      blocks: override?.blocks,
    });
  }

  const webhookUrl = getSlackWebhookFromProfile(profile);

  return slackWebhookSend(webhookUrl, message);
};

export default send;
