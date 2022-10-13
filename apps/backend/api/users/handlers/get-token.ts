import { HttpEventHandler } from "~/api/lists/types";
import { NotFound } from "~/lib/http-errors";
import { assertPathParam } from "~/lib/lambda-response";
import { getToken } from "~/lib/token-storage";
import { IApiUsersGetTokenResponse } from "~/types.public";
import { recipientTokenToUsersTokenBody } from "./lib";

export const usersGetTokenHandler: HttpEventHandler<IApiUsersGetTokenResponse> =
  async (context) => {
    const token = assertPathParam(context, "token");

    const recipientToken = await getToken({
      tenantId: context.tenantId,
      token,
    });

    if (!recipientToken) {
      throw new NotFound();
    }

    return {
      status: 200,
      body: recipientTokenToUsersTokenBody(recipientToken),
    };
  };
