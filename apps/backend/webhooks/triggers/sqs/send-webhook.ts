import { SQSHandler, SQSRecord } from "aws-lambda";
import axios, { AxiosRequestConfig } from "axios";
import https from "https";
import logger from "~/lib/logger";

import { TIMEOUT_MS } from "~/webhooks/lib/constants";
import { getWebhookHeader } from "~/webhooks/lib/get-webhook-header";
import { handleException } from "~/webhooks/lib/handle-exception";
import getWebhookLogService from "~/webhooks/services/dynamo-service";
import { listWebhooks } from "~/webhooks/services/list-webhooks";
import { updateLog } from "~/webhooks/services/update-log";

import { IWebhookLog, OutboundWebhookEventBody } from "~/webhooks/types";

export const recordHandler = async (record: SQSRecord) => {
  if (!record?.body) {
    return;
  }

  const eventBody = JSON.parse(record.body) as OutboundWebhookEventBody;

  try {
    const { detail, id: eventId } = eventBody;
    const { data, type, tenantId } = detail;

    const webhooks = await listWebhooks(tenantId);

    if (!webhooks?.length) {
      return;
    }
    const webhookLogService = getWebhookLogService(tenantId);

    logger.debug("before client");
    const axiosClient = axios.create({
      httpsAgent: new https.Agent({ keepAlive: true }),
    });
    logger.debug("after client");

    await Promise.all<void>(
      webhooks.map(async (webhook) => {
        if (!webhook.json.events.includes("*")) {
          return;
        }

        const headers = getWebhookHeader({
          body: JSON.stringify({
            data,
            type,
          }),
          secret: webhook?.json?.secret,
        });

        const request: AxiosRequestConfig = {
          data: {
            data,
            type,
          },
          headers,
          method: "POST",
          timeout: TIMEOUT_MS,
          url: webhook.json.url,
        };

        try {
          const { request: __, ...response } = await axiosClient(request);

          const webhookLog: IWebhookLog = {
            logType: type,
            objectId: data.id,
            request,
            response,
            status: "OK",
            webhookId: webhook.id,
          };

          await updateLog(webhookLogService, webhookLog, eventId);
          return;
        } catch (err) {
          if (axios.isAxiosError(err)) {
            const webhookLog: IWebhookLog = {
              logType: type,
              objectId: data.id,
              request,
              response: err.response,
              status: "ERROR",
              webhookId: webhook.id,
            };

            await updateLog(webhookLogService, webhookLog, eventId);
          }

          throw err;
        }
      })
    );
  } catch (error) {
    await handleException(eventBody, error);
  }
};

export const handle: SQSHandler = async (event) => {
  await Promise.all(event.Records.map(recordHandler));
};
