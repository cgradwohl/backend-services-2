const { STAGE } = process.env;

const IS_DEPLOY_PREVIEW =
  /^https:\/\/deploy-preview-.*--staging-trycourier\.netlify\.app$/;

// Ex: https://staging-studio-bvpz1fq73-trycourier.vercel.app/
const IS_VERCEL_DEPLOY_PREVIEW =
  /^https:\/\/staging-studio-.*-trycourier\.vercel\.app$/;

interface IHeaders {
  origin: string;
}

const getCorsOrigin = ():
  | string
  | ((request: { headers: IHeaders }) => string) => {
  switch (STAGE) {
    case "production":
      return ({ headers: { origin } }) =>
        origin === "https://www.trycourier.app" ||
        origin === "https://app2.courier.com"
          ? origin
          : "https://app.courier.com";
    // Function example here: https://github.com/evert0n/koa-cors/blob/master/test/index.js#L171
    case "staging":
      return ({ headers: { origin: o } }) =>
        o.match(IS_DEPLOY_PREVIEW) ||
        o === "https://staging2.trycourier.app" || // we want to get vercel working w/o impacting current affair w netlify
        o.match(IS_VERCEL_DEPLOY_PREVIEW) // exclusively for vercel previews
          ? o
          : "https://staging.trycourier.app";
    case "dev":
      return "http://localhost:3000";
  }
};

export const validateOrigin = (headers: IHeaders) => {
  const origin = getCorsOrigin();

  if (!origin) {
    return;
  }

  if (typeof origin === "string") {
    return origin;
  }

  return origin({ headers });
};

export default getCorsOrigin;
