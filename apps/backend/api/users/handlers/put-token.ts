import { HttpEventHandler } from "~/api/lists/types";
import { assertBody, assertPathParam } from "~/lib/lambda-response";
import { putToken } from "~/lib/token-storage";
import { IApiUsersPutTokenResponse } from "~/types.public";
import { usersTokenBodyToWritableRecipientToken } from "./lib";
import { validatePutTokenBody } from "./lib/validation";

export const usersPutTokenHandler: HttpEventHandler<IApiUsersPutTokenResponse> =
  async (context) => {
    const token = assertPathParam(context, "token");
    const recipientId = assertPathParam(context, "id");
    const body = assertBody(context);
    validatePutTokenBody(body);

    const formattedToken = usersTokenBodyToWritableRecipientToken({
      tenantId: context.tenantId,
      recipientId,
      token,
      ...body,
    });

    await putToken(formattedToken);

    return { status: 204 };
  };
