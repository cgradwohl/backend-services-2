import { HttpEventHandler } from "~/api/lists/types";
import { NotFound } from "~/lib/http-errors";
import { assertPathParam } from "~/lib/lambda-response";
import { getTokensByRecipient } from "~/lib/token-storage";
import { IApiUsersGetTokensResponse } from "~/types.public";
import { recipientTokenToUsersTokenBody } from "./lib";

/** GET /users/:id/tokens */
export const usersGetTokensHandler: HttpEventHandler<IApiUsersGetTokensResponse> =
  async (context) => {
    const recipientId = assertPathParam(context, "id");

    const tokens = await getTokensByRecipient({
      tenantId: context.tenantId,
      recipientId,
    });

    return {
      status: 200,
      body: { tokens: tokens.map(recipientTokenToUsersTokenBody) },
    };
  };
