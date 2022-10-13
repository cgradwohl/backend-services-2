import { HttpEventHandler } from "~/api/lists/types";
import { getPatchedDocument } from "~/lib/json-patch";
import { assertBody, assertPathParam } from "~/lib/lambda-response";
import { getToken, putToken } from "~/lib/token-storage";
import { IApiUsersPatchTokenResponse, IUsersTokenData } from "~/types.public";
import {
  recipientTokenToUsersTokenBody,
  usersTokenBodyToWritableRecipientToken,
} from "./lib";
import { validatePatchTokenBody } from "./lib/validation";

export const usersPatchTokenHandler: HttpEventHandler<IApiUsersPatchTokenResponse> =
  async (context) => {
    const token = assertPathParam(context, "token");
    const recipientId = assertPathParam(context, "id");
    const body = assertBody<unknown>(context);
    validatePatchTokenBody(body);

    const recipientToken = await getToken({
      tenantId: context.tenantId,
      token,
    });
    const tokenData = recipientTokenToUsersTokenBody(recipientToken);

    const updated = getPatchedDocument(
      tokenData,
      body.patch
    ) as IUsersTokenData;

    await putToken({
      ...usersTokenBodyToWritableRecipientToken({
        tenantId: context.tenantId,
        recipientId,
        token,
        ...updated,
      }),
      created: recipientToken.created,
    });

    return { status: 204 };
  };
