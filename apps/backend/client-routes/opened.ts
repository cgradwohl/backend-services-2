import uuidPackage from "uuid-apikey";
import captureException from "~/lib/capture-exception";
import { get as getMessage } from "~/lib/dynamo/messages";
import getUrlParameters from "~/lib/get-url-params";
import { BadRequest } from "~/lib/http-errors";
import { error } from "~/lib/log";

import { createOpenedEvent } from "~/lib/dynamo/event-logs";
import { getTaxonomyFromProvider } from "~/lib/taxonomy-helpers";
import { getTrackingRecord } from "~/lib/tracking-service";
import { ChannelDetails } from "~/types.internal";

export const transparentBase64Gif =
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export interface IOpenedEvent {
  headers: {
    Host: string;
    Referer?: string;
  };
  path: {
    openedParam: string;
  };
  identity: {
    sourceIp: string;
    userAgent: string;
  };
}

const isIgnoredOpenUserAgent = (
  callback,
  sent: number,
  userAgent: string
): boolean => {
  const IGNORED_USER_AGENT_PARTS = [
    "FrontApp.com", // ex: Mozilla/5.0 (FrontApp.com ImageProxy) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.53 Safari/537.36
    "GoogleImageProxy", // ex: Mozilla/5.0 (Windows NT 5.1; rv:11.0) Gecko Firefox/11.0 (via ggpht.com GoogleImageProxy)
  ];

  return IGNORED_USER_AGENT_PARTS.some((agent) => {
    /*
      Special Notes for GoogleImageProxy:
      This user agent receives special consideration. Opens happening within
      BUFFER_WINDOW will not be marked as opened. They are considered automatic
      image caching attempts by Google's Image Proxy.
    */
    const BUFFER_WINDOW = 20 * 1000; // milliseconds
    const sentBeforeBufferElapse = sent
      ? Date.now() - +new Date(sent) < BUFFER_WINDOW
      : false;

    const ignored = userAgent.includes("GoogleImageProxy")
      ? sentBeforeBufferElapse &&
        userAgent.toLowerCase().includes(agent.toLowerCase())
      : userAgent.toLowerCase().includes(agent.toLowerCase());

    if (ignored) {
      callback(null, transparentBase64Gif);
    }

    return ignored;
  });
};

const isIgnoredOpenReferer = (callback, referer: string): boolean => {
  // TODO: In the future we also want to omit staging and dev instances
  const IGNORED_REFERERS = ["app.courier.com", "www.trycourier.app"];

  return IGNORED_REFERERS.some((ignoredReferer) => {
    const ignored = referer
      ?.toLowerCase()
      .includes(ignoredReferer.toLowerCase());

    if (ignored) {
      callback(null, transparentBase64Gif);
    }

    return ignored;
  });
};

export const handle = async (event: IOpenedEvent, _context, callback) => {
  const {
    headers,
    path: { openedParam },
    identity: { sourceIp: ip, userAgent },
  } = event;

  try {
    const { tenantId, slug = "" } = getUrlParameters(headers.Host, openedParam);
    const trackingId = slug.replace(".gif", "");

    if (!tenantId) {
      throw new BadRequest("Missing tenantId");
    }

    if (!trackingId) {
      throw new BadRequest("Missing trackingId");
    }
    // check if messageId
    // this is an api key with all lowercase letters
    if (!uuidPackage.isAPIKey(trackingId)) {
      const message = await getMessage(tenantId, trackingId);
      const channels = message?.channels?.values as string[];
      // do not mark messages opened by ignored consumers
      if (
        !message ||
        isIgnoredOpenUserAgent(callback, message.sent, userAgent) ||
        isIgnoredOpenReferer(callback, headers.Referer)
      ) {
        callback(null, transparentBase64Gif);
        return;
      }
      const channel: ChannelDetails = {
        taxonomy: message.provider
          ? getTaxonomyFromProvider(message.provider)
          : "",
      };
      await createOpenedEvent(tenantId, trackingId, message.provider, channel, {
        channels,
        headers,
        ip,
        userAgent,
      });
    } else {
      const trackingRecord = await getTrackingRecord(tenantId, trackingId);

      if (!trackingRecord?.messageId) {
        throw new BadRequest(
          `Invalid trackingId - ${trackingId} for tenantId - ${tenantId}. Cannot find associated messageId.`
        );
      }

      const message = await getMessage(tenantId, trackingRecord.messageId);
      // do not mark messages opened by ignored consumers
      if (
        !message ||
        isIgnoredOpenUserAgent(callback, message.sent, userAgent) ||
        isIgnoredOpenReferer(callback, headers.Referer)
      ) {
        callback(null, transparentBase64Gif);
        return;
      }
      const channel: ChannelDetails = {
        id: trackingRecord.channelId ?? trackingRecord.channel?.id,
        taxonomy: trackingRecord.channel?.taxonomy,
      };

      const channels = message?.channels?.values as string[];
      await createOpenedEvent(
        tenantId,
        trackingRecord.messageId,
        trackingRecord.providerKey,
        channel,
        {
          ...trackingRecord,
          headers,
          ip,
          userAgent,
          channels,
        }
      );
    }
  } catch (err) {
    // we still want to return the transparent gif regardless if there is an error
    error(err && err.message ? err.message : err);
    await captureException(err);
  }

  callback(null, transparentBase64Gif);
};
