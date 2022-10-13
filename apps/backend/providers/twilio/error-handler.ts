import {
  RetryableProviderResponseError,
  ProviderResponseError,
} from "../errors";

const handleError = (err: any) => {
  const status = err.response?.status;
  const code = err.response?.data?.code;

  // https://support.twilio.com/hc/en-us/articles/223181868-Troubleshooting-Undelivered-Twilio-SMS-Messages
  // https://www.twilio.com/docs/api/errors#2-anchor
  if (status === 400) {
    switch (code) {
      case 20003:
      case 20005:
      case 20006:
      case 20008:
      case 20010:
      case 20403:
      case 20426:
      case 20429:
        throw new RetryableProviderResponseError(err);
      default:
        throw new ProviderResponseError(err);
    }
  }

  if ([429, 500, 503].includes(status)) {
    throw new RetryableProviderResponseError(err);
  }

  if ([401, 404, 405].includes(status)) {
    throw new ProviderResponseError(err);
  }

  throw new ProviderResponseError(err);
};

export default handleError;
