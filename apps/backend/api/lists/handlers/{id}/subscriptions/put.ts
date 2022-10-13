import ajv from "~/lib/ajv";
import { Conflict } from "~/lib/http-errors";
import { assertBody, assertPathParam } from "~/lib/lambda-response";
import { putSubscriptions } from "~/lib/lists";
import { ListItemArchivedError } from "~/lib/lists/errors";

import { HttpEventHandler } from "~/api/lists/types";
import { schema as preferencesSchema } from "~/lib/preferences/validate";
import {
  IApiPutListItemSubscriptionsRequest,
  IApiPutListItemSubscriptionsResponse,
} from "~/types.public";

type Body = IApiPutListItemSubscriptionsRequest["body"];

export const schema = {
  additionalProperties: false,
  definitions: {
    recipient: {
      additionalProperties: false,
      properties: {
        preferences: {
          properties: preferencesSchema.properties,
          required: ["notifications"],
          type: "object",
        },
        recipientId: { type: "string" },
      },
      required: ["recipientId"],
      type: "object",
    },
    ...preferencesSchema.definitions,
  },
  properties: {
    recipients: {
      items: { $ref: "#/definitions/recipient" },
      type: "array",
      uniqueItemProperties: ["recipientId"],
    },
  },
  type: "object",
};

export const validate = ajv.compile(schema);

const handler: HttpEventHandler<IApiPutListItemSubscriptionsResponse> = async (
  context
) => {
  const id = assertPathParam(context, "id");
  const { recipients } = assertBody<Body>(context, { validateFn: validate });

  try {
    await putSubscriptions(context.tenantId, context.userId, id, recipients);
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
