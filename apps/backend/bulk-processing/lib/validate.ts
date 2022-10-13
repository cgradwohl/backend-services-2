import { getScopedBrand } from "~/api/send";
import { assertOptionalJsonField } from "~/api/send/lib/assert-optional-json-field";
import { ContentMessage, Message, TemplateMessage } from "~/api/send/types";
import {
  validateMessageBrandId,
  validateMessageChannels,
  validateMessageContent,
  validateMessageData,
  validateMessageMetadata,
  validateMessageProviders,
  validateMessageRouting,
  validateMessageTemplate,
} from "~/api/send/validation/validate-v2-request-hardcoded";
import assertStateIsValid from "~/lib/assertions/is-valid-scope-state";
import { IBrand } from "~/lib/brands/types";
import { BadRequest, NotFound } from "~/lib/http-errors";
import { ApiRequestContext } from "~/lib/lambda-response";
import { InboundBulkMessage } from "../types";

export async function validateMessage(
  inboundMessage: InboundBulkMessage,
  context: ApiRequestContext
) {
  if (inboundMessage.message) {
    validateApiV2(inboundMessage, context);
    return;
  }

  await validateApiV1(inboundMessage, context);
}

async function validateApiV1(
  message: InboundBulkMessage,
  context: ApiRequestContext
) {
  const { tenantId, scope, useMaterializedBrands } = context;

  const [state] = scope.split("/");
  assertStateIsValid(state);

  const { event } = message;

  assertOptionalJsonField(message, "data");

  if (!event) {
    throw new BadRequest("The 'event' parameter is required.");
  }

  if (typeof event !== "string") {
    throw new BadRequest("The 'event' parameter must be a string.");
  }

  // valid brand required
  const brandId = message.brand;
  let brand: IBrand;
  if (brandId) {
    try {
      brand = await getScopedBrand(
        tenantId,
        brandId,
        state,
        useMaterializedBrands
      );
    } catch (e) {
      if (e instanceof NotFound) {
        throw new BadRequest(`Invalid brand (${brandId})`);
      }
      throw e;
    }

    if (!brand) {
      throw new BadRequest(`Invalid brand (${brandId})`);
    }

    if (!brand.published && ["published", "submitted"].includes(state)) {
      // brand must be published
      throw new BadRequest(`Brand (${brandId}) not published`);
    }
  }
}

function validateApiV2(
  inboundMessage: InboundBulkMessage,
  context: ApiRequestContext
) {
  const { scope } = context;

  const [state] = scope.split("/");
  assertStateIsValid(state);

  const { message } = inboundMessage;

  if (typeof message !== "object") {
    throw new BadRequest("Invalid Request. 'message' must be of type object.");
  }

  if (
    (message as ContentMessage).content &&
    (message as TemplateMessage).template
  ) {
    throw new BadRequest(
      "Invalid Request. Either 'content' or 'template' may be defined, but not both."
    );
  }

  if (
    !(message as ContentMessage).content &&
    !(message as TemplateMessage).template
  ) {
    throw new BadRequest(
      "Invalid Request. Either 'content' or 'template' must be defined."
    );
  }

  /**
   * if an invalid key is passed it prevents the request from being accepted.
   */
  const objectKeys = Object.keys(message);
  const validKeys = [
    "brand_id",
    "channels",
    "content",
    "data",
    "metadata",
    "providers",
    "routing",
    "template",
    "to",
  ];
  const invalidKeyExists = objectKeys.some((key) => !validKeys.includes(key));

  if (invalidKeyExists) {
    const invalidKey = objectKeys
      .filter((key) => !validKeys.includes(key))
      .pop();

    throw new BadRequest(
      `Invalid Request. '${invalidKey}' is not a valid property of 'message'.`
    );
  }

  validateMessageContent((message as ContentMessage).content);

  validateMessageTemplate((message as TemplateMessage).template);

  // NOTE: currently, brand support is only available to a Template Message
  validateMessageBrandId((message as TemplateMessage).brand_id);

  validateMessageChannels((message as Message).channels);

  validateMessageProviders((message as Message).providers);

  validateMessageRouting((message as Message).routing);

  validateMessageData((message as Message).data);

  validateMessageMetadata(
    (message as ContentMessage).metadata,
    context.tenantId
  );
}
