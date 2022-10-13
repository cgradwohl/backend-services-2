import { createClickedEvent } from "~/lib/dynamo/event-logs";
import getUrlParams from "~/lib/get-url-params";
import { BadRequest, NotFound } from "~/lib/http-errors";
import { handleRaw } from "~/lib/lambda-response";
import { getTrackingRecord } from "~/lib/tracking-service";
import { ChannelDetails } from "~/types.internal";

type BlockListItem = (
  userAgent: string,
  ip: string,
  headers: { [key: string]: string }
) => boolean;

const blockListSlackbotLinkExpander = (userAgent) => {
  return userAgent.includes("Slackbot-LinkExpanding");
};

const blockList: BlockListItem[] = [blockListSlackbotLinkExpander];

export const handle = handleRaw(async (event) => {
  const {
    event: {
      headers,
      pathParameters: { redirectParam } = { redirectParam: undefined },
      requestContext: {
        domainName,
        identity: { sourceIp: ip, userAgent },
      },
    },
  } = event;

  const { slug: trackingId, tenantId } = getUrlParams(
    domainName,
    redirectParam
  );

  if (!tenantId) {
    throw new BadRequest("Missing tenantId");
  }

  if (!trackingId) {
    throw new BadRequest("Missing trackingId");
  }

  const linkRecord = await getTrackingRecord(tenantId, trackingId);

  if (!linkRecord) {
    throw new NotFound("Link record not found");
  }

  const {
    data: { href },
    messageId,
  } = linkRecord;

  const channel: ChannelDetails = {
    id: linkRecord.channel?.id,
    taxonomy: linkRecord.channel?.taxonomy,
  };

  if (
    !blockList.some((blockListEntry) => blockListEntry(userAgent, ip, headers))
  ) {
    await createClickedEvent(
      tenantId,
      messageId,
      linkRecord.providerKey,
      channel,
      {
        ...linkRecord,
        clickHeaders: headers,
        clickIp: ip,
        clickUserAgent: userAgent,
        forwardingUrl: href,
      }
    );
  }

  return {
    body: "",
    headers: {
      Location: href,

      // turn off cors
      "Access-Control-Allow-Credentials": undefined,
      "Access-Control-Allow-Origin": undefined,
    },
    status: 302,
  };
});
