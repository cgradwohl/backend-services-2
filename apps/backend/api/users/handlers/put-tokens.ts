import { HttpEventHandler } from "~/api/lists/types";
import { assertBody, assertPathParam } from "~/lib/lambda-response";
import { putTokens } from "~/lib/token-storage";
import { IApiUsersPutTokensResponse } from "~/types.public";
import { usersTokenBodyToWritableRecipientToken } from "./lib";
import { validatePutTokensBody } from "./lib/validation";

export const usersPutTokensHandler: HttpEventHandler<IApiUsersPutTokensResponse> =
  async (context) => {
    const recipientId = assertPathParam(context, "id");
    const body = assertBody(context);
    validatePutTokensBody(body);

    const tokens = body.tokens.map((item) =>
      usersTokenBodyToWritableRecipientToken({
        tenantId: context.tenantId,
        recipientId,
        ...item,
      })
    );

    await putTokens({ tenantId: context.tenantId, recipientId, tokens });

    return { status: 204 };
  };
