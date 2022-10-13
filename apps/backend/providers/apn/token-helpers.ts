import { TokenUsageResult } from "~/lib/token-storage";

// https://github.com/parse-community/node-apn/blob/master/doc/provider.markdown#class-apnprovider
export function tokenStatusMapper(
  tokens: string[],
  response: any
): TokenUsageResult[] {
  return tokens.map((token) => {
    const failure = response?.failed?.find(
      (failure) =>
        failure.device === token &&
        tokenRelatedFailures.has(failure.response?.reason ?? "")
    );

    return {
      token,
      status: !!failure ? "failed" : "active",
      reason: failure?.response?.reason,
    };
  });
}

const tokenRelatedFailures = new Set([
  "BadDeviceToken",
  "DeviceTokenNotForTopic",
  "MissingDeviceToken",
  "Unregistered",
]);
