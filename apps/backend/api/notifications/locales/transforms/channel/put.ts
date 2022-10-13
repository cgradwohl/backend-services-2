import { BadRequest, NotFound } from "~/lib/http-errors";
import {
  CourierObject,
  INotificationJsonWire,
  ITemplateLocaleChannel,
  ITemplateLocales,
} from "~/types.api";
import { IApiNotificationPutChannelLocales } from "~/types.public";

export const transformRequest = (
  template: CourierObject<INotificationJsonWire>,
  channelId: string, // External API facing channelId; prefixes with `channel_`
  locales: ITemplateLocales,
  incomingLocales: IApiNotificationPutChannelLocales
) => {
  const internalChannelId = channelId.replace("channel_", "");

  const allChannels = [
    ...template?.json?.channels?.bestOf,
    ...template?.json?.channels?.always,
  ];

  const targetChannel = allChannels.find(
    (channel) => channel.id === internalChannelId
  );

  if (!targetChannel) {
    throw new NotFound("Channel does not exist");
  }

  if (!targetChannel.config?.email && !targetChannel.config?.push) {
    throw new BadRequest("Channel type not eligible for localization");
  }

  const channelType = targetChannel.config.email ? "email" : "push";

  for (const locale of Object.keys(incomingLocales ?? {})) {
    locales[locale] = locales?.[locale] ?? {
      blocks: [],
      channels: [],
    };

    const localeString = incomingLocales?.[locale] as string;

    const localeChannel: ITemplateLocaleChannel = {
      content: {
        subject: channelType === "email" ? localeString : undefined,
        title: channelType === "push" ? localeString : undefined,
      },
      id: internalChannelId,
    };

    const localeChannelIndex = locales?.[locale].channels?.findIndex(
      (localizedChannel) => localizedChannel.id === internalChannelId
    );

    if (localeChannelIndex >= 0) {
      locales[locale].channels[localeChannelIndex] = {
        ...localeChannel,
      };
    } else {
      locales[locale].channels.push({ ...localeChannel });
    }
  }
  return locales;
};
