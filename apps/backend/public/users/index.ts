import KoaRouter from "koa-router";
import * as cognito from "~/lib/cognito";
import { getSsoProviderCognitoIdFromEmail } from "~/lib/cognito/sso/get-sso-provider-from-email";
import { validateOrigin } from "~/lib/get-cors-origin";
import { BadRequest } from "~/lib/http-errors";
import { assertBody } from "~/lib/koa-assert";
import * as magicLogin from "~/lib/magic-login";
import { rateLimitMiddleware } from "~/lib/middleware";

const users = new KoaRouter();

users.post("/login", rateLimitMiddleware("login"), async (ctx) => {
  const body = assertBody(ctx) as {
    email: string;
    invitationCode?: string;
  };

  const origin = validateOrigin(ctx.request.header);

  if (!origin) {
    throw new BadRequest("Invalid Origin");
  }
  body.email = body.email.trim();

  // RFC 3696
  if (body.email.length > 320) {
    throw new BadRequest("Email Address too long");
  }

  const customSsoProvider = await getSsoProviderCognitoIdFromEmail(body.email);
  if (customSsoProvider) {
    ctx.status = 200;
    ctx.body = { customSsoProvider };
    return;
  }

  await magicLogin.create(body, origin);
  ctx.status = 200;
  ctx.body = {};
});

users.post(
  "/login/verify",
  rateLimitMiddleware("login/verify"),
  async (ctx) => {
    const body = assertBody(ctx) as {
      accessToken: string;
    };
    try {
      const response = await magicLogin.get(body.accessToken);

      const { email } = response.data;
      let { userId } = response.data;

      if (!userId) {
        const newUser = await cognito.createUser(email);
        userId = newUser.id;
      }

      ctx.body = {
        userId,
      };
    } catch (err) {
      throw new BadRequest("Invalid accessToken");
    }
  }
);

export default users;
