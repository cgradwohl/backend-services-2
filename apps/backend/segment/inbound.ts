import { incrementMetric } from "~/lib/datadog";
import { BadRequest, NotFound } from "~/lib/http-errors";
import * as idempotentRequests from "~/lib/idempotent-requests";
import {
  DuplicateIdempotentRequestError,
  IIdempotentRequest,
} from "~/lib/idempotent-requests/types";
import { assertBody, handleApi } from "~/lib/lambda-response";
import { assertValidPattern, get as getList } from "~/lib/lists";
import logger from "~/lib/logger";
import createTraceId from "~/lib/x-ray/create-trace-id";
import requests from "~/tracking-requests/services/tracking-requests";
import validateSegmentGroupRequest from "./group/validator";
import validateSegmentIdentifyRequest from "./identify/validator";
import validateSegmentTrackRequest from "./track/validator";
import {
  IInboundSegmentGroupRequest,
  IInboundSegmentIdentifyRequest,
  IInboundSegmentPostRequest,
  IInboundSegmentPostResponse,
  IInboundSegmentTrackRequest,
  InboundSegmentRequestTypesEnum,
} from "./types";

async function validateListOrPatternIfExists(
  body: IInboundSegmentPostRequest,
  tenantId: string
) {
  const listId = body.properties?.courier?.list;
  const listPattern = body.properties?.courier?.pattern;
  // validate if list or pattern is provided are valid before sending to segment worker
  if (listId) {
    const listResponse = await getList(tenantId, listId);
    // fromCourierObject in getList throws explicit null if list is not found
    if (listResponse === null) {
      throw new NotFound(`List ${listId} not found`);
    }
    if (!listResponse?.id) {
      throw new BadRequest(`Cannot send to archived list (${listId})`);
    }
  }
  if (listPattern) {
    assertValidPattern(listPattern);
  }
}

export const handle = handleApi<IInboundSegmentPostResponse>(
  async (context) => {
    const { tenantId, shouldUseInboundSegmentEventsKinesis } = context;
    const messageId = createTraceId();

    const body = assertBody<IInboundSegmentPostRequest>(context);

    const idempotencyKey = body.messageId as string;
    const isSegmentEventTester = idempotencyKey.startsWith(
      "segment-test-message-"
    );

    let existingRequest: IIdempotentRequest;
    // do not make events coming in via Segment Event Tester idempotent
    if (!isSegmentEventTester) {
      try {
        await idempotentRequests.put(tenantId, idempotencyKey, {
          // we would not have these during the first attempt
          // it gets patched after executing the callback function
          body: undefined,
          statusCode: undefined,
        });
      } catch (err) {
        // idempotent request found
        if (err instanceof DuplicateIdempotentRequestError) {
          existingRequest = await idempotentRequests.get(
            context.tenantId,
            idempotencyKey
          );
          return {
            body:
              existingRequest.body && typeof existingRequest.body === "string"
                ? JSON.parse(existingRequest.body)
                : existingRequest.body,
            status: existingRequest.statusCode || 202,
          };
        }
        // bubble up the unexpected errors
        throw err;
      }
    }

    let response: { body?: any; status?: number };

    try {
      // validate the type
      switch (body.type) {
        case InboundSegmentRequestTypesEnum.IDENTIFY:
          validateSegmentIdentifyRequest(
            body as IInboundSegmentIdentifyRequest
          );
          await incrementMetric(tenantId, "segment.identify");
          break;

        case InboundSegmentRequestTypesEnum.GROUP:
          validateSegmentGroupRequest(body as IInboundSegmentGroupRequest);
          await incrementMetric(tenantId, "segment.group");
          break;

        case InboundSegmentRequestTypesEnum.TRACK:
          validateSegmentTrackRequest(body as IInboundSegmentTrackRequest);

          const sendByList = body?.properties?.courier?.list;
          const sendByPattern = body?.properties?.courier?.pattern;

          if (sendByList && sendByPattern) {
            throw new Error(
              "Only one of the following courier properties allowed: 'list', 'pattern'"
            );
          }
          await incrementMetric(tenantId, "segment.track");
          break;

        default:
          logger.debug(`Event Type Unsupported: ${body.type}`, body);
          // segment expects a 501 returned when a `type`
          // isn't supported by a destination:
          // https://segment.com/docs/partners/build-webhook/#responding-to-segment
          response = {
            body: {
              message: `Event Type Unsupported: ${body.type}`,
            },
            status: 501,
          };
      }
      await validateListOrPatternIfExists(body, tenantId);
    } catch (err) {
      response = {
        body: {
          message: err.message,
        },
        status: 400,
      };
    }

    if (!response) {
      const { anonymousId, event, userId } = body;

      // Here we write to s3
      await requests(context.tenantId, context.scope).create(
        messageId,
        {
          event,
          user: userId ?? anonymousId,
          data: body,
        },
        shouldUseInboundSegmentEventsKinesis
      );

      response = {
        body: {
          messageId,
        },
        status: 202,
      };
    }

    // save the new response
    if (!isSegmentEventTester) {
      await idempotentRequests.update(context.tenantId, idempotencyKey, {
        body: response.body ? JSON.stringify(response.body) : undefined,
        statusCode: response.status || 202,
      });
    }

    return response;
  }
);
