import parseAmznTraceId from "~/lib/amzn-trace-id";
import {
  ApiRequestContext,
  assertBody,
  assertPathParam,
} from "~/lib/lambda-response";
import parseJsonObject from "~/lib/parse-json-object";
import jsonStore from "~/lib/s3";
import createTraceId from "~/lib/x-ray/create-trace-id";

import { S3PrepareMessage } from "~/types.internal";
import * as PublicTypes from "~/types.public";

import GetRoutableSummary from "../mediators/get-routable-summary";

const { put: putMessage } = jsonStore<S3PrepareMessage>(
  process.env.S3_MESSAGES_BUCKET
);

const mediator = new GetRoutableSummary();

const execute = async (
  messageId: string,
  tenantId: string,
  message: S3PrepareMessage,
  options: {
    filename?: string;
  } = {}
) => {
  const filename = options.filename ?? `prepare_${messageId}`;
  const filePath = `${tenantId}/${filename}.json`;

  await putMessage(filePath, message);

  const results = await mediator.run({
    messageId,
    messageLocation: {
      path: filePath,
      type: "S3",
    },
    tenantId,
    type: "prepare",
  });

  if (!Array.isArray(results)) {
    return [
      {
        recipient: message.recipientId,
        routing: { reason: results.result, selected: false },
      },
    ];
  }

  return results.map((result) => ({
    recipient: message.recipientId,
    routing: result,
  }));
};

const apiError = (
  message: string,
  status: number = 400
): PublicTypes.IApiError => {
  return {
    body: {
      message,
      status,
    },
    status,
  };
};

const getSummaryByRecipient = async (
  messageId: string,
  tenantId: string,
  eventId: string,
  recipient: PublicTypes.RoutingRecipient
) => {
  const eventData = parseJsonObject(recipient.data);
  const eventPreferences = parseJsonObject<PublicTypes.IProfilePreferences>(
    recipient.preferences
  );
  const eventProfile = parseJsonObject(recipient.profile);
  const recipientId = recipient?.recipient;

  if (!recipientId) {
    return apiError("The 'recipient' parameter is required.");
  }

  if (typeof recipientId !== "string") {
    return apiError("The 'recipient' parameter must be a string.");
  }

  if (eventProfile === null) {
    return apiError("The 'profile' parameter must be valid JSON.");
  }

  if (eventData === null) {
    return apiError("The 'data' parameter must be valid JSON.");
  }

  const event = {
    eventData,
    eventId,
    eventPreferences,
    eventProfile,
    recipientId,
  };

  return execute(messageId, tenantId, event, {
    filename: `prepare_${messageId}_${recipientId}`,
  });
};

export const handle = async ({
  context,
  messageId,
}: {
  context: ApiRequestContext;
  messageId: string;
}) => {
  const body = assertBody<PublicTypes.ApiSendRoutingRequest>(context);
  const tenantId = context.tenantId;
  const eventId = assertPathParam(context, "id");

  if (!eventId) {
    return apiError("The 'event' parameter is required");
  }

  if (!body.recipients?.length) {
    return apiError("The recipients array require at least one entry");
  }

  return Promise.all(
    body.recipients.map(async (recipient) =>
      getSummaryByRecipient(messageId, tenantId, eventId, recipient)
    )
  );
};

export const getRoutableSummary = async (context: ApiRequestContext) => {
  const messageId = createTraceId();

  return {
    body: {
      results: await handle({ context, messageId }),
    },
  };
};
