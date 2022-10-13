import { CourierClient } from "@trycourier/courier";

const stagingUrl =
  "https://yubmnstah4.execute-api.us-east-1.amazonaws.com/staging";

const getBaseUrl = (allowDev: boolean) => {
  // undefined defaults us to api.courier.com
  if (process.env.STAGE === "production") {
    return undefined;
  }

  if (allowDev && process.env.STAGE === "dev") {
    return process.env.API_URL;
  }

  return stagingUrl;
};

interface ICourierOptions {
  allowDev?: boolean;
}

export default (options?: ICourierOptions) => {
  const courier = CourierClient({
    authorizationToken: options?.allowDev
      ? process.env.COURIER_DEV_AUTH_TOKEN
      : process.env.COURIER_AUTH_TOKEN,
    baseUrl: getBaseUrl(options?.allowDev),
  });

  return courier;
};
