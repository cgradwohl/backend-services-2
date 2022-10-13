import extend from "deep-extend";
import {
  ContentMessage,
  TemplateMessage,
  UserRecipient,
} from "~/api/send/types";
import { RequestPayload } from "~/send/service/data/request/request.types";
import { IMessage, ISendMessageContext } from "~/send/types";
import { isContentMessage } from "~/send/utils/is-content-message";
import { isTemplateMessage } from "~/send/utils/is-template-message";
import { ITenant } from "~/types.api";
import { prepareFromContentMessage } from "./prepare-from-content-message";
import { prepareFromTemplateMessage } from "./prepare-from-template-message";

export async function prepareContext({
  message,
  tenant,
  request,
  environment,
  shouldVerifyRequestTranslation,
}: {
  message: IMessage;
  tenant: ITenant;
  request: RequestPayload;
  environment: "production" | "test";
  shouldVerifyRequestTranslation?: boolean;
}): Promise<ISendMessageContext | false> {
  const messageTemplate = {
    environment,
    message: message.message,
    messageId: message.messageId,
    request,
    tenant,
    data: extend(
      message.message.data ?? {},
      (message.message.to as UserRecipient)?.data ?? {}
    ),
  };

  // TODO: unify Prepare: https://linear.app/trycourier/issue/C-5037/add-routingstrategy-support-to-a-templatemessage
  if (isTemplateMessage(messageTemplate.message)) {
    return prepareFromTemplateMessage({
      ...messageTemplate,
      message: messageTemplate.message as TemplateMessage,
      shouldVerifyRequestTranslation,
    });
  }

  // TODO: unify Prepare: https://linear.app/trycourier/issue/C-5037/add-routingstrategy-support-to-a-templatemessage
  if (isContentMessage(messageTemplate.message)) {
    return prepareFromContentMessage({
      ...messageTemplate,
      message: messageTemplate.message as ContentMessage,
    });
  }
}
