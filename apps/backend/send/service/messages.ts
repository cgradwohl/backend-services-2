import { nanoid } from "nanoid";
import { create } from "~/lib/dynamo/messages-v3-adapter";
import { getJson, putJson } from "~/send/stores/s3/messages";
import { AdHocListMessageRecipient, MessageService } from "~/send/types";
import { InternalSendError, InvalidArgumentSendError } from "../errors";
import { SendError } from "../errors/types";
import { getEventId } from "../utils/get-event-id";

const messageService: MessageService = (tenantId: string) => {
  return {
    create: async ({ message, shouldVerifyRequestTranslation = false }) => {
      try {
        const {
          apiVersion,
          idempotencyKey,
          jobId,
          message: requestMessage,
          messageId,
          requestId,
          sequenceId,
          sequenceActionId,
          source,
        } = message;
        const profile = message?.message?.to;

        if (!profile) {
          throw new InvalidArgumentSendError(
            "Profile is a required in order to create the message entity."
          );
        }

        const { filePath } = await putJson({ messageId, json: message });

        if (shouldVerifyRequestTranslation === true) {
          return { filePath, message };
        }

        const pattern =
          "list_pattern" in profile ? profile.list_pattern : undefined;

        // if list_id is not in the profile, then use the ad_hoc_list_id if it exists
        const listId =
          "list_id" in profile
            ? profile.list_id
            : (profile as AdHocListMessageRecipient).ad_hoc_list_id ??
              undefined;

        // if the profile has a list_id or ad_hoc_list_id, then use the requestId as the "listMessageId"
        const listMessageId =
          "list_id" in profile || "ad_hoc_list_id" in profile
            ? requestId
            : undefined;
        const recipientId =
          "user_id" in profile ? profile.user_id : `anon_${nanoid()}`;

        const eventId = getEventId(requestMessage);

        // note: create() throws AlreadyExistsSendError
        // note: create() throws InternalSendError
        await create(
          tenantId,
          eventId,
          recipientId!,
          messageId,
          pattern,
          listId,
          listMessageId,
          {
            apiVersion,
            idempotencyKey,
            jobId,
            requestId,
            sequenceId,
            sequenceActionId,
            source,
            tags: requestMessage?.metadata?.tags,
            traceId: requestMessage?.metadata?.trace_id,
          }
        );

        return { filePath, message };
      } catch (error) {
        if (error instanceof SendError) {
          // the error is already classified, so re throw
          throw error;
        }

        // the error is not classified
        throw new InternalSendError(error);
      }
    },

    get: async ({ filePath }) => {
      const message = await getJson({ filePath });

      return message;
    },
  };
};

export default messageService;
