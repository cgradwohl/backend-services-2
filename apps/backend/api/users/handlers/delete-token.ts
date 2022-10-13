import { HttpEventHandler } from "~/api/lists/types";
import { assertPathParam } from "~/lib/lambda-response";
import { deleteToken } from "~/lib/token-storage";
import { IApiUsersDeleteTokenResponse } from "~/types.public";

export const usersDeleteTokenHandler: HttpEventHandler<IApiUsersDeleteTokenResponse> =
  async (context) => {
    const token = assertPathParam(context, "token");

    await deleteToken({
      tenantId: context.tenantId,
      token,
    });

    return { status: 204 };
  };
