// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");

import FormData from "@discordjs/form-data";
import axios from "axios";
import { IVariableHandler } from "~/lib/variable-handler";
import { handleSendError, ProviderConfigurationError } from "../errors";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "../lib/constants";
import { DeliveryHandler } from "../types";

interface IDiscordConfig {
  channel_id?: string;
  user_id?: string;
}

const url = "https://discordapp.com/api";

function assertDiscordConfig(
  config: any
): asserts config is { botToken: string } {
  if (!("botToken" in config) || !config?.botToken?.length) {
    throw new ProviderConfigurationError("No Bot Token specified.");
  }
}

const getResolvedMessageId = (
  path: string,
  variableHandler: IVariableHandler
) => {
  const resolved = variableHandler.resolve(path, undefined);

  if (!resolved) {
    return;
  }

  if (Array.isArray(resolved)) {
    return resolved[0];
  }

  return resolved;
};

const send: DeliveryHandler = async (params, template) => {
  assertDiscordConfig(params.config);

  const { override, config, discordConfig = {}, variableHandler } = params;
  const profile = params.profile.discord as unknown as IDiscordConfig;
  let channelId = profile.channel_id as string;
  const userId = profile.user_id as string;
  const message = template.md;
  const { messageId, replyToMessageId } = discordConfig;
  const editMessageId = messageId
    ? getResolvedMessageId(messageId, variableHandler)
    : undefined;
  const replyMessageId = replyToMessageId
    ? getResolvedMessageId(replyToMessageId, variableHandler)
    : undefined;

  const providerAttachments = params?.override?.attachments ?? [];

  let headers;
  let body;

  try {
    if (providerAttachments.length) {
      body = new FormData();
      for (const attachment of providerAttachments) {
        body.append(
          attachment.filename,
          Buffer.from(attachment.data, "base64"),
          attachment.filename
        );
        body.append(
          "payload_json",
          JSON.stringify(
            jsonMerger.mergeObjects([
              { content: message },
              override?.body ?? {},
            ])
          )
        );
        headers = body.getHeaders();
      }
    } else {
      body = {
        content: message,
        ...(replyMessageId && {
          message_reference: {
            message_id: replyMessageId,
          },
        }),
      };
      if (override?.body) {
        body = jsonMerger.mergeObjects([body, override.body]);
      }
      headers = {
        "Content-Type": "application/json",
      };
    }

    if (override?.headers) {
      headers = jsonMerger.mergeObjects([headers, override.headers]);
    }

    headers = {
      ...headers,
      Authorization: `Bot ${config.botToken}`,
    };

    if (!channelId && userId) {
      channelId = await axios
        .post(
          `${url}/users/@me/channels`,
          { recipient_id: userId },
          {
            headers: {
              Authorization: `Bot ${config.botToken}`,
            },
            timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
            timeoutErrorMessage: "Discord API request timed out.",
          }
        )
        .then((response) => response.data.id);
    }

    // Send the message
    const { data } = editMessageId
      ? await axios.patch(
          `${url}/channels/${channelId}/messages/${editMessageId}`,
          body,
          { headers }
        )
      : await axios.post(`${url}/channels/${channelId}/messages`, body, {
          headers,
        });
    return data;
  } catch (error) {
    handleSendError(error);
  }
};

export default send;
