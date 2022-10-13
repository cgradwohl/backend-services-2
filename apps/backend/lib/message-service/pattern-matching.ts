import { match } from "typescript-pattern-matching";
import { IEventLogEntry } from "~/types.api";
import { IMessageLog, MessageStatus } from "./types";

export interface IFoundEvents {
  clicked: boolean;
  delivered: boolean;
  opened: boolean;
  sent: boolean;
  undeliverable: boolean;
}

export interface IGetEventArg {
  eventNotification: IEventLogEntry;
  eventReceived?: IEventLogEntry;
  eventUnmapped: IEventLogEntry;
}

export const getChannelKey = (
  value: { hasClass: boolean; hasStar: boolean },
  parsedTaxonomy: { channel?: string; class?: string; provider?: string }
): string =>
  match(value)
    .with({ hasClass: false, hasStar: true }, () => parsedTaxonomy.channel)
    .with({ hasClass: true, hasStar: true }, () => parsedTaxonomy.class)
    .otherwise(() => parsedTaxonomy.provider)
    .run();

export const getEvent = (arg: IGetEventArg) =>
  match<IGetEventArg, string>(arg)
    .with(
      { eventNotification: { json: { eventId: String } } },
      ({
        eventNotification: {
          json: { eventId },
        },
      }) => eventId
    )
    .with(
      { eventUnmapped: { json: { eventId: String } } },
      ({
        eventUnmapped: {
          json: { eventId },
        },
      }) => eventId
    )
    .with(
      { eventReceived: { json: { body: { event: String } } } },
      ({
        eventReceived: {
          json: {
            body: { event },
          },
        },
      }) => event
    )
    .otherwise(() => undefined)
    .run();

export const getGroupKey = (
  provider: string,
  channel?: { id: string },
  channelId?: string
): string =>
  match({ channel, channelId })
    .with({ channel: { id: String } }, (c) => c.channel.id)
    .with({ channelId: String }, (c) => c.channelId)
    .otherwise(() => provider)
    .run();

export const getProviders = (
  value: { includeProviders: boolean; statusWithProviders: boolean },
  fn: () => IMessageLog["providers"]
): IMessageLog["providers"] =>
  match(value)
    .with({ includeProviders: true, statusWithProviders: true }, () => fn())
    .with({ includeProviders: true, statusWithProviders: false }, () => [])
    .otherwise(() => undefined)
    .run();

export const getProviderStatus = (foundEvents: IFoundEvents): MessageStatus =>
  match(foundEvents)
    .with({ clicked: true }, () => "CLICKED")
    .with({ opened: true }, () => "OPENED")
    .with({ delivered: true }, () => "DELIVERED")
    .with({ sent: true, undeliverable: true }, () => "UNDELIVERABLE")
    .with({ sent: true, undeliverable: false }, () => "SENT")
    .with({ sent: false, undeliverable: true }, () => "UNDELIVERABLE")
    .run();

export const getSentTimestamp = (arg: {
  delivered: number;
  providerSent: IEventLogEntry;
}): number =>
  match(arg)
    .with(
      { providerSent: { timestamp: Number } },
      ({ providerSent: event }) => event.timestamp
    )
    .with({ delivered: Number }, (a) => a.delivered)
    .otherwise(() => undefined)
    .run();
