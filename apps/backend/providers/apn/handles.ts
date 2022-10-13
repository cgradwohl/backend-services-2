import { match } from "typescript-pattern-matching";
import { providerHasStoredTokens, TokensByProvider } from "~/lib/token-storage";
import { ProviderResponseError } from "../errors";
import { HandlesFn } from "../types";

interface IArg {
  token?: string;
  tokens?: string | string[];
}

const handles: HandlesFn = ({
  profile,
  tokensByProvider,
}: {
  profile?: any;
  tokensByProvider?: TokensByProvider;
}) => {
  const throwError = () => {
    throw new Error("profile.apn.tokens must be an array");
  };

  try {
    // profile.apn is now optional as tokens may be stored in the token storage API
    const arg: IArg = profile.apn;
    if (arg) {
      return match<IArg, boolean>(arg)
        .with({ token: String }, () => true)
        .with({ tokens: [String] }, (x) => x.tokens.length > 0)
        .with({ tokens: String }, () => true)
        .withNot({ tokens: [String] }, throwError)
        .run();
    }

    return providerHasStoredTokens("apn", tokensByProvider);
  } catch (err) {
    throw new ProviderResponseError(err);
  }
};

export default handles;
