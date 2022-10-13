import { EntryTypes } from "~/lib/dynamo/event-logs";
import { getJson, putJson } from "~/reprocessors/stores/s3/events";
import { IReprocessorService } from "~/reprocessors/types";
import { IEventReprocessorPayloadInput } from "~/reprocessors/types/events";
import { MaxRetryCountReachedError } from "../lib/error";

export default (): IReprocessorService => {
  const MAX_RETRY_COUNT = 10;

  // Event types used by Prepare and Route workers
  const ALLOWED_EVENT_TYPES = [
    EntryTypes.eventFiltered,
    EntryTypes.eventRouted,
    EntryTypes.eventUnmapped,
    EntryTypes.profileLoaded,
    EntryTypes.providerError,
    EntryTypes.providerRendered,
    EntryTypes.providerSent,
    EntryTypes.providerSimulated,
    EntryTypes.undeliverable,
    EntryTypes.unroutable,
  ];

  const isSupported = (input: IEventReprocessorPayloadInput) => {
    return ALLOWED_EVENT_TYPES.includes(input.type);
  };

  return {
    save: async (input) => {
      const eventReprocessorInput = input as IEventReprocessorPayloadInput;
      try {
        if (!isSupported(eventReprocessorInput)) {
          return;
        }

        const payload = await getJson(eventReprocessorInput);
        if (payload?.metadata.retryCount === MAX_RETRY_COUNT) {
          throw new MaxRetryCountReachedError();
        }

        await putJson({
          input: {
            ...eventReprocessorInput,
          },
          metadata: {
            lastUpdatedAt: new Date().toISOString(),
            retryCount: (payload?.metadata.retryCount ?? 0) + 1,
            type: "event",
          },
        });
      } catch (err) {
        if (err instanceof MaxRetryCountReachedError) {
          // tslint:disable-next-line: no-console
          console.warn(
            `Max retry count reached for ${JSON.stringify(
              eventReprocessorInput
            )}`
          );
        }
        // intentionally not bubbling up
        // tslint:disable-next-line: no-console
        console.error(
          `Could not save the payload for reprocessing ${JSON.stringify(
            eventReprocessorInput
          )}`,
          err
        );
      }
    },
  };
};
