import KoaRouter from "koa-router";
import crypto from "crypto";

const intercomUserHash = new KoaRouter();
const secret = process.env.INTERCOM_IDENTITY_VERIFICATION_SECRET;

// see more details about intercom identity verication:
// https://www.intercom.com/help/en/articles/183-enable-identity-verification-for-web-and-mobile
intercomUserHash.get("/", async context => {
  const { userId } = context.userContext;
  context.body = {};

  if (secret) {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(userId);
    const hash = hmac.digest("hex");
    context.body = { intercomUserHash: hash };
  }
});

export default intercomUserHash;
