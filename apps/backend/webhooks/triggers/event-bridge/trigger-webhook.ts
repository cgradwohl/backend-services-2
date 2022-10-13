import { EventBridgeHandler } from "aws-lambda";
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import crypto from "crypto";

import captureException from "~/lib/capture-exception";
import dynamoObjectService from "~/lib/dynamo/object-service";
import logger from "~/lib/logger";

import getWebhookLogService from "../../services/dynamo-service";

import { toApiKey } from "~/lib/api-key-uuid";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import createMessages from "~/lib/message-service/create-messages";
import { TIMEOUT_MS } from "~/webhooks/lib/constants";
import { IWebhookJson, IWebhookLog, IWebhookPayload } from "../../types";

interface IMessage {
  enqueued: number;
  eventId: string;
  id: string;
  messageStatus: string;
  notificationId: string;
  recipientId: string;
  tenantId: string;
}

type Handler = EventBridgeHandler<
  string,
  { NewImage: IMessage; OldImage: IMessage },
  void
>;

const webhookService = dynamoObjectService<IWebhookJson>("webhook");

function assertMessageStatusUnchanged(updated: IMessage, previous: IMessage) {
  return updated.messageStatus === previous.messageStatus;
}

// https://stripe.com/docs/webhooks/signatures
// https://github.com/stripe/stripe-node/blob/master/lib/Webhooks.js
const signatureUtil = () => {
  const computeSignature = (payload, secret) => {
    return crypto
      .createHmac("sha256", secret)
      .update(payload, "utf8")
      .digest("hex");
  };

  return {
    getHeader: (body: string, secret: string) => {
      const headers = {};
      const timestamp = Date.now();
      const payload = `${timestamp}.${body}`;
      const signature = computeSignature(payload, secret);

      headers["courier-signature"] = `t=${timestamp},signature=${signature}`;
      return headers;
    },
  };
};

// TODO: make it better in the future (take out, strategy pattern etc.)
const getPayload = async (event: any): Promise<IWebhookPayload> => {
  const {
    detail: { NewImage: message, OldImage: previous },
  } = event;

  // Messages-V2
  if (
    event["detail-type"] ===
    `table.${getTableName(TABLE_NAMES.MESSAGES_TABLE_NAME)}`
  ) {
    if (assertMessageStatusUnchanged(message, previous)) {
      return;
    }

    const [data] = await createMessages(
      message.tenantId,
      [{ ...message, messageId: message.id, status: message.messageStatus }],
      true
    );

    return {
      data,
      type: "message:updated",
    };
  }

  // Objects
  if (
    event["detail-type"] ===
    `table.${getTableName(TABLE_NAMES.OBJECTS_TABLE_NAME)}`
  ) {
    const objtype = message?.objtype ?? previous?.objtype;
    // We use notification-draft object type to save published timestamps
    if (objtype !== "notification-draft") {
      return;
    }

    // Notification hard-delete
    if (!message && previous) {
      return;
    }

    if ((message?.json?.published ?? 0) > (previous?.json?.published ?? 0)) {
      return {
        data: {
          id: toApiKey(message.json.notificationId),
          published_at: message.json.published,
        },
        type: "notification:published",
      };
    }

    if ((message?.json?.submitted ?? 0) > (previous?.json?.submitted ?? 0)) {
      return {
        data: {
          id: toApiKey(message.json.notificationId),
          submission_id: message.json.submitted,
        },
        type: "notification:submitted",
      };
    }

    if ((message?.json?.canceled ?? 0) > (previous?.json?.canceled ?? 0)) {
      return {
        data: {
          canceled_at: message.json.canceled,
          id: toApiKey(message.json.notificationId),
          submission_id: message.json.submitted,
        },
        type: "notification:submission_canceled",
      };
    }
  }
};

export async function handle(event, _, callback): Promise<Handler> {
  try {
    const {
      detail: { NewImage: message, OldImage: previous },
    } = event;

    const payload = await getPayload(event);

    if (!payload) {
      callback();
      return;
    }

    const { objects: webhooks } = await webhookService.list({
      ExpressionAttributeValues: {
        ":webhook": "settings/webhook",
      },
      FilterExpression: "begins_with(id, :webhook)",
      tenantId: message.tenantId,
    });

    if (!webhooks?.length) {
      return;
    }

    // Optimize: LRU or caching
    const webhookLogService = getWebhookLogService(message.tenantId);
    await Promise.all<void>(
      webhooks.map(async (webhook) => {
        if (!webhook.json.events.includes("*")) {
          return;
        }

        const attempted = await webhookLogService.get(webhook.id, event.id);
        if (attempted?.status === "OK") {
          return;
        }

        const headers = webhook.json.secret
          ? signatureUtil().getHeader(
              JSON.stringify(payload),
              webhook.json.secret
            )
          : undefined;

        const request: AxiosRequestConfig = {
          data: payload,
          headers,
          method: "POST",
          timeout: TIMEOUT_MS,
          url: webhook.json.url,
        };
        try {
          const { request: __, ...response } = await axios(request);
          const webhookLog: IWebhookLog = {
            logType: payload.type,
            objectId: message.id,
            request,
            response,
            status: "OK",
            webhookId: webhook.id,
          };

          await webhookLogService.update(webhookLog, event.id);

          callback(null, "Finished");
        } catch (err) {
          if (axios.isAxiosError(err)) {
            const webhookLog: IWebhookLog = {
              logType: payload.type,
              objectId: message.id,
              request,
              response: err.response,
              status: "ERROR",
              webhookId: webhook.id,
            };

            await webhookLogService.update(webhookLog, event.id);
            return;
          }

          throw err;
        }
      })
    );
  } catch (err) {
    logger.error(err);
    await captureException(err);
    callback(err);
  }
}
