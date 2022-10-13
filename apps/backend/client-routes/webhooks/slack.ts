import { get as getConfiguration } from "~/lib/configurations-service";
import {
  createClickedEvent,
  createWebhookResponseEvent,
} from "~/lib/dynamo/event-logs";
import forwardWebhook from "~/lib/forward-webhook";
import getUrlParameters from "~/lib/get-url-params";
import { BadRequest, Conflict, NotFound } from "~/lib/http-errors";
import { handleRaw } from "~/lib/lambda-response";
import checkSlackSignature from "~/lib/slack/check-slack-signature";
import generateSlackSignature from "~/lib/slack/generate-slack-signature";
import generateSlackWebhookBody from "~/lib/slack/generate-slack-webhook-body";
import parseSlackWebhookBody from "~/lib/slack/parse-slack-webhook-body";
import { getTrackingRecord } from "~/lib/tracking-service";
import { ChannelDetails, ITrackingRecord } from "~/types.internal";

export const getTrackingId = (payload: any): string | undefined => {
  try {
    return payload.actions.length === 1 &&
      typeof payload.actions[0].action_id === "string"
      ? payload.actions[0].action_id
      : undefined;
  } catch (err) {
    console.warn(err);
  }
};

const handleTracking = async (
  trackingRecord: ITrackingRecord | undefined,
  tenantId: string,
  slackPayload: any,
  clickHeaders: { [header: string]: string },
  clickIp: string,
  clickUserAgent: string,
  forwardingUrl: string
): Promise<void> => {
  if (!trackingRecord) {
    return;
  }

  const { messageId } = trackingRecord;

  const channel: ChannelDetails = {
    id: trackingRecord.channel?.id,
    taxonomy: trackingRecord.channel?.taxonomy,
  };
  await createClickedEvent(
    tenantId,
    messageId,
    trackingRecord.providerKey,
    channel,
    {
      ...trackingRecord,
      clickHeaders,
      clickIp,
      clickUserAgent,
      forwardingUrl,
      slackPayload,
    }
  );
};

const handleWebhookResponse = async (
  trackingRecord: ITrackingRecord | undefined,
  tenantId: string,
  webhookResponseData: {
    headers: { [header: string]: string };
    body: string;
    status: number;
  }
): Promise<void> => {
  if (!trackingRecord) {
    return;
  }

  const { messageId } = trackingRecord;

  await createWebhookResponseEvent(tenantId, messageId, {
    ...trackingRecord,
    ...webhookResponseData,
  });
};

export const swapActionId = (
  body: string,
  signature: string,
  trackingId: string,
  actionId: string,
  payload: any,
  signingSecret: string,
  timestamp: string
): { forwardBody; forwardSignature } => {
  if (!actionId || !trackingId) {
    return {
      forwardBody: body,
      forwardSignature: signature,
    };
  }

  // swap our trackingId for the the user actionId in the payload body
  const newPayload = {
    ...(payload as object),
    actions: (payload as any).actions.map((action) => {
      if (action.action_id !== trackingId) {
        return action;
      }

      return {
        ...action,
        action_id: actionId,
      };
    }),
  };

  // regenerate the body (string) and sign
  const forwardBody = generateSlackWebhookBody(newPayload);
  const forwardSignature = generateSlackSignature(
    signingSecret,
    timestamp,
    forwardBody
  );

  // return the values we need to forward to the customer's webhook URL
  return {
    forwardBody,
    forwardSignature,
  };
};

export const handle = handleRaw(async (event) => {
  const {
    event: {
      body,
      headers,
      pathParameters = { configurationId: "" },
      requestContext: {
        domainName,
        identity: { sourceIp: ip, userAgent },
      },
    },
  } = event;

  const {
    "X-Slack-Request-Timestamp": timestamp,
    "X-Slack-Signature": signature,
  } = headers;

  const { slug: configurationId, tenantId } = getUrlParameters(
    domainName,
    pathParameters.configurationId
  );

  if (!timestamp) {
    throw new BadRequest("Missing timestamp");
  }

  if (!signature) {
    throw new BadRequest("Missing signature");
  }

  if (!tenantId) {
    throw new BadRequest("Missing tenantId");
  }

  if (!configurationId) {
    throw new BadRequest("Missing configurationId");
  }

  const payload = parseSlackWebhookBody(body);
  const trackingId = getTrackingId(payload);

  const [trackingRecord, configuration] = await Promise.all([
    getTrackingRecord(tenantId, trackingId),
    getConfiguration({
      id: configurationId,
      tenantId,
    }),
  ]);

  if (!configuration) {
    throw new NotFound("Configuration not found");
  }

  const {
    json: { signingSecret, webhookUrl },
  } = configuration as unknown as {
    json: { signingSecret?: string; webhookUrl?: string };
  };

  if (!signingSecret) {
    throw new Conflict("Slack configuration is missing signing secret");
  }

  checkSlackSignature(signingSecret, body, signature, timestamp);

  await handleTracking(
    trackingRecord,
    tenantId,
    payload,
    headers,
    ip,
    userAgent,
    webhookUrl
  );

  // cannot forward if they have not set up a webhook url
  if (!webhookUrl) {
    console.warn(
      `${tenantId} is missing webhookUrl in their configuration [${configurationId}]`
    );
    return {
      body: JSON.stringify({ success: true }),
      status: 200,
    };
  }

  const { forwardBody, forwardSignature } = swapActionId(
    body,
    signature,
    trackingId,
    trackingRecord ? trackingRecord.data.actionId : undefined,
    payload,
    signingSecret,
    timestamp
  );

  const webhookResponseData = await forwardWebhook(
    "post",
    webhookUrl,
    forwardBody,
    {
      Accept: headers.Accept,
      "Accept-Encoding": headers["Accept-Encoding"],
      "Content-Type": headers["Content-Type"],
      "User-Agent": headers["User-Agent"],
      "X-Forwarded-For": headers["X-Forwarded-For"], // add ip?
      "X-Slack-Request-Timestamp": timestamp,
      "X-Slack-Signature": forwardSignature,
    }
  );

  await handleWebhookResponse(trackingRecord, tenantId, webhookResponseData);

  return webhookResponseData;
});
