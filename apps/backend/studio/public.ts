import { verify as verifyInvitationCode } from "../lib/invitation-service/invite-user-code";
import { BadRequest, NotFound } from "../lib/http-errors";
import { assertBody, getQueryParam, handleRaw } from "../lib/lambda-response";
import * as Types from "../types.api";

export const checkBetaAccessCode = handleRaw<Types.BetaAccessCodesPostResponse>(
  async (context) => {
    const codes = (process.env.CODES || "").split(",");
    const body = assertBody<Types.BetaAccessCodesPostRequest>(context);
    const success = codes.includes(body.code);

    return {
      body: {
        success,
      },
    };
  }
);

export const verifyInvitation = handleRaw<Types.VerifyInvitationResponse>(
  async (ctx) => {
    let code: string;
    let email: string;

    try {
      code = getQueryParam(ctx, "code");
    } catch (err) {
      throw new BadRequest("Code Required");
    }

    try {
      email = getQueryParam(ctx, "email");
    } catch (err) {
      throw new BadRequest("Invitation Email Required");
    }

    let tenantId: string;
    try {
      const response = await verifyInvitationCode(code);
      tenantId = response.data.tenantId;
    } catch (err) {
      if (err instanceof NotFound) {
        throw err;
      }

      if (err.message.match(/not found/i)?.length) {
        throw new NotFound("Invalid Invitation Code");
      }

      throw new Error(err);
    }

    return {
      body: { tenantId },
    };
  }
);
