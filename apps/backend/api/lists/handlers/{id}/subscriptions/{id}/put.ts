import ajv from "~/lib/ajv";
import { Conflict } from "~/lib/http-errors";
import {
  assertAndDecodePathParam,
  assertBody,
  assertPathParam,
} from "~/lib/lambda-response";
import { subscribe } from "~/lib/lists";
import { ListItemArchivedError } from "~/lib/lists/errors";

import { schema as preferencesSchema } from "~/lib/preferences/validate";
import {
  IApiListItemSubscribeResponse,
  IApiPutRecipientSubscriptionRequest,
  IProfilePreferences,
} from "~/types.public";
import { HttpEventHandler } from "../../../../types";
type Body = IApiPutRecipientSubscriptionRequest["body"];

export const schema = {
  additionalProperties: false,
  definitions: preferencesSchema.definitions,
  properties: {
    preferences: {
      properties: preferencesSchema.properties,
      required: ["notifications"],
      type: "object",
    },
  },
  type: "object",
};

const validate = ajv.compile(schema);

const handler: HttpEventHandler<IApiListItemSubscribeResponse> = async (
  context
) => {
  const id = assertPathParam(context, "id");
  const recipientId = assertAndDecodePathParam(context, "recipientId");
  const response = assertBody<Body>(context, {
    allowEmptyBody: true,
    validateFn: validate,
  });
  const preferences = response?.preferences ?? ({} as IProfilePreferences);
  try {
    await subscribe(
      context.tenantId,
      context.userId,
      id,
      recipientId,
      preferences
    );
    return { status: 204 };
  } catch (e) {
    if (e instanceof ListItemArchivedError) {
      throw new Conflict("List has been archived");
    } else {
      throw e;
    }
  }
};

export default handler;
