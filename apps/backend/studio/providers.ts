import { createPrebuiltWelcomeTemplate } from "./../lib/notification-service/index";
const { google } = require("googleapis");
import { decode } from "jsonwebtoken";
import KoaRouter from "koa-router";
import { assertBody } from "~/lib/koa-assert";

import { create, list, replace } from "~/lib/configurations-service";
import { BadRequest } from "~/lib/http-errors";

interface ICourierGmailAuthorization {
  code: string;
  redirectURL?: string;
  env?: string;
}
interface IIdTokenPayload {
  iss: string;
  azp: string;
  aud: string;
  sub: string; // gaia id
  hd: string;
  email: string;
  email_verified: boolean;
  at_hash: string;
  iat: number;
  exp: number;
  name?: string;
  picture?: string;
}

const providersRouter = new KoaRouter();

providersRouter.post("/gmail/authorize/callback", async (ctx) => {
  const body = assertBody(ctx) as ICourierGmailAuthorization;

  const { code, redirectURL } = body;

  const env = body.env ?? "production";

  if (!redirectURL) {
    throw new BadRequest("A valid redirect URL is required.");
  }

  if (!code) {
    throw new BadRequest("A valid Authorization Code is required.");
  }

  const { tenantId, userId } = ctx.userContext;

  const configs = await list({ tenantId });

  // filter out gmail providers, currently there is only one, but we need to support many
  const { id: configId, json: configJson } = configs.objects.find(
    ({ json }) => json.provider === "gmail"
  ) ?? { id: undefined };

  if (configId) {
    if (configJson.authCode && code === configJson.authCode) {
      ctx.status = 200;
      ctx.body = { message: "ok" };

      return;
    }
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_SEND_PROVIDER_CLIENT_ID,
    process.env.GOOGLE_SEND_PROVIDER_CLIENT_SECRET,
    redirectURL
  );

  let tokens;
  try {
    const tokenResponse = await oauth2Client.getToken(code);
    tokens = tokenResponse.tokens;
  } catch (e) {
    const errorObject = {
      Error: e.response.data.error,
      reason: e.response.data.error_description,
      status: e.response.status,
      statusText: e.response.statusText,
    };

    ctx.status = e.response.status;
    ctx.message = JSON.stringify(errorObject);

    return;
  }

  const { access_token, id_token, refresh_token, scope } = tokens;

  if (!scope?.includes("https://www.googleapis.com/auth/gmail.send")) {
    const errorObject = {
      Error: "Send scope not granted",
      reason: "Courier needs permission to send emails on your behalf",
      status: 403,
      statusText: "access denied",
    };
    ctx.status = 403;
    ctx.message = JSON.stringify(errorObject);

    return;
  }
  oauth2Client.setCredentials(tokens);

  const {
    email: fromEmail,
    name: userName,
    picture: userPicture,
  } = decode(id_token) as IIdTokenPayload;

  if (configId) {
    if (env === "test") {
      await replace(
        { id: configId, tenantId, userId },
        {
          json: {
            ...configJson,
            test: {
              access_token,
              fromEmail,
              id_token,
              refresh_token,
              userName,
              userPicture,
            },
          },
          title: "Default Configuration",
        }
      );
    } else {
      await replace(
        { id: configId, tenantId, userId },
        {
          json: {
            ...configJson,
            access_token,
            fromEmail,
            id_token,
            provider: "gmail",
            refresh_token,
            userName,
            userPicture,
          },
          title: "Default Configuration",
        }
      );
    }
  } else {
    await create(
      { tenantId, userId },
      {
        json: {
          authCode: code,
          access_token,
          fromEmail,
          id_token,
          provider: "gmail",
          refresh_token,
          userName,
          userPicture,
        },
        title: "Default Configuration",
      }
    );
  }
  ctx.status = 200;
  ctx.body = { message: "ok" };
});

export default providersRouter;
