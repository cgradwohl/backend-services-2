import KoaRouter from "koa-router";
import querystring from "querystring";

import { encode } from "~/lib/base64";
import getUserByToken from "~/lib/cognito/get-user-by-token";
import handleErrorLog from "~/lib/handle-error-log";
import { BadRequest } from "~/lib/http-errors";
import { assertBody } from "~/lib/koa-assert";
import generateHmac from "~/lib/sso/community/generate-hmac";
import getCommunityUser from "~/lib/sso/community/get-community-user";
import { ISsoCommunityRequest, ISsoCommunityResponseRequest } from "./types";

/*
  docs for discourse community forum sso:
  https://meta.discourse.org/t/official-single-sign-on-for-discourse-sso/13045
*/

const ssoCommunity = new KoaRouter();

ssoCommunity.post("/", async (context) => {
  const { sig, sso } = assertBody(context) as ISsoCommunityRequest;
  try {
    const valid = generateHmac(sso) === sig;
    const payload = Buffer.from(sso, "base64").toString();
    const nonce = querystring.parse(payload).nonce;
    context.body = { nonce, valid };
    context.status = 200;
  } catch (e) {
    handleErrorLog(e);
    throw new BadRequest("Invalid SSO:Community Sign In Request");
  }
});

ssoCommunity.post("/response", async (context) => {
  const { accessToken, nonce } = assertBody(
    context
  ) as ISsoCommunityResponseRequest;
  try {
    const { email, externalId } = await getUserByToken(accessToken);
    const name = email.split("@")[0];
    // this is a hack to determine whether the `require_activation` property
    // should be true || false. looking up the user with our extneral id
    const requireActivation = await getCommunityUser(externalId);
    const payload = new URLSearchParams({
      email,
      external_id: externalId,
      name,
      nonce,
      require_activation: `${requireActivation}`,
    }).toString();
    const base64Payload = encode(payload);
    context.body = {
      sig: generateHmac(base64Payload),
      sso: encodeURIComponent(base64Payload),
    };
    context.status = 200;
  } catch (e) {
    handleErrorLog(e);
    if (e.status !== 400) {
      throw e;
    }
    throw new BadRequest("Error Generating SSO:Community Sign In Response");
  }
});

export default ssoCommunity;
