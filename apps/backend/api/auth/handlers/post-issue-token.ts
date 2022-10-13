import { sign } from "jsonwebtoken";
import { HttpEventHandler } from "~/api/lists/types";
import { NotFound } from "~/lib/http-errors";
import { assertBody } from "~/lib/lambda-response";
import { IApiAuthPostIssueTokenResponse } from "~/types.public";
import uuid from "uuid";
import getApiKey from "~/lib/tenant-service/get-api-key";

export const postIssueTokenHandler: HttpEventHandler<IApiAuthPostIssueTokenResponse> =
  async (context) => {
    const body = assertBody(context, { allowEmptyBody: true }) as any;
    const { tenantId, scope } = context;
    const apiKey = await getApiKey(tenantId, scope);

    if (!apiKey) {
      throw new NotFound();
    }

    const token = sign(
      {
        ...body,
        tenant_scope: context.scope,
        tenant_id: tenantId,
        expires_in: undefined,
      },
      apiKey,
      {
        ...(body.expires_in ? { expiresIn: body.expires_in } : {}),
        jwtid: uuid.v4(),
      }
    );

    return {
      status: 200,
      body: { token },
    };
  };
