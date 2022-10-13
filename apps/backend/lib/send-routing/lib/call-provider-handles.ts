import { TokensByProvider } from "~/lib/token-storage";
import providers from "~/providers";
import { IProviderConfiguration } from "~/send/types";
import { JSONObject } from "~/types.api";

export const callProviderHandles = ({
  providerConfig,
  providerKey,
  data,
  profile,
  tokensByProvider,
}: {
  providerKey: string;
  providerConfig: IProviderConfiguration;
  data?: JSONObject;
  profile?: JSONObject;
  tokensByProvider?: TokensByProvider;
}): Promise<boolean | string | Error> | boolean | Error => {
  return (
    providers[providerKey]?.handles({
      config: providerConfig,
      data,
      profile,
      tokensByProvider,
    }) ?? false
  );
};
