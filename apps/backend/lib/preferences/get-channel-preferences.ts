import { INotificationWire, NotificationCategory } from "~/types.api";
import { IChannel } from "~/types.api";
import { ChannelClassification, IProfilePreferences } from "~/types.public";
import { toApiKey } from "../api-key-uuid";
import { mapPreferences } from "./get-user-preference";

const getChannelIndices = (
  bestOfChannels: IChannel[],
  preferredChannelTaxonomy: string
): number[] =>
  bestOfChannels
    .map((bestOfChannel, index) =>
      bestOfChannel.taxonomy.startsWith(preferredChannelTaxonomy) ? index : -1
    )
    .filter((channelIndex) => channelIndex >= 0);
interface IPreviousValue {
  channelsByPreferences: IChannel[];
  preferredChannelsByTaxonomies: ChannelClassification[];
  unpreferredChannelsInBestOf: IChannel[];
}
type SortChannelsByPreferencesFn = (
  previousValue: IPreviousValue,
  channel: IChannel,
  index: number,
  allBestOfs: IChannel[]
) => IPreviousValue | IChannel[];

const sortChannelsByPreferences: SortChannelsByPreferencesFn = (
  {
    channelsByPreferences,
    preferredChannelsByTaxonomies,
    unpreferredChannelsInBestOf,
  },
  _,
  index,
  allBestOfs
) => {
  if (preferredChannelsByTaxonomies.length) {
    const preferredChannel = preferredChannelsByTaxonomies.shift();
    const hasPreferredChannelInBestOf = allBestOfs.some((bestOfChannel) =>
      bestOfChannel.taxonomy.startsWith(preferredChannel)
    );
    channelsByPreferences = [
      ...channelsByPreferences,
      ...(hasPreferredChannelInBestOf
        ? getChannelIndices(allBestOfs, preferredChannel).map(
            (i) => allBestOfs[i]
          )
        : []),
    ];
  }

  // If we are at the last index in allBestOfs
  if (index === allBestOfs.length - 1) {
    return [
      ...channelsByPreferences,
      ...allBestOfs.filter((bestOfChannel) =>
        channelsByPreferences.some(
          (channelByPreference) => channelByPreference.id !== bestOfChannel.id
        )
      ),
    ];
  } else {
    return {
      channelsByPreferences,
      preferredChannelsByTaxonomies,
      unpreferredChannelsInBestOf,
    };
  }
};
/**
 * Returns bestOfChannels sorted either by channel preferences or if no channel preferences present, returns the same array
 */
export function getChannelPreferences(
  category: Partial<NotificationCategory>,
  notification: Partial<INotificationWire>,
  recipientPreferences: Partial<IProfilePreferences>,
  bestOfChannels: IChannel[]
): IChannel[] {
  recipientPreferences = mapPreferences(recipientPreferences);
  if (category) {
    const categoryId = toApiKey(category?.id);
    const categoryChannelPreferences =
      recipientPreferences?.categories?.[categoryId]?.channel_preferences;

    if (categoryChannelPreferences?.length) {
      const preferredChannelsByTaxonomies = categoryChannelPreferences.map(
        ({ channel }) => channel
      );

      return bestOfChannels.reduce<IPreviousValue | IChannel[]>(
        sortChannelsByPreferences,
        {
          channelsByPreferences: [],
          preferredChannelsByTaxonomies,
          unpreferredChannelsInBestOf: [],
        }
      ) as IChannel[];
    }
  }

  const notificationId = toApiKey(notification?.id);
  const notificationChannelPreferences =
    recipientPreferences?.notifications?.[notificationId]?.channel_preferences;

  if (notificationChannelPreferences?.length) {
    const preferredChannelsByTaxonomies = notificationChannelPreferences.map(
      ({ channel }) => channel
    );

    return bestOfChannels.reduce<IPreviousValue | IChannel[]>(
      sortChannelsByPreferences,
      {
        channelsByPreferences: [],
        preferredChannelsByTaxonomies,
        unpreferredChannelsInBestOf: [],
      }
    ) as IChannel[];
  }
  return bestOfChannels;
}
