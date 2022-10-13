import { match } from "typescript-pattern-matching";
import { providerHasStoredTokens } from "~/lib/token-storage";
import { ProviderResponseError } from "../errors";
import { HandlesFn } from "../types";

interface IArg {
  token?: string;
  tokens?: string | string[];
}

const handles: HandlesFn = ({ profile, tokensByProvider }) => {
  const throwError = () => {
    throw new Error("profile.expo.tokens must be an array");
  };

  try {
    const arg: IArg = (profile as any).expo;
    if (arg) {
      return match<IArg, boolean>(arg)
        .with({ token: String }, () => true)
        .with({ tokens: [String] }, (x) => x.tokens.length > 0)
        .with({ tokens: String }, () => true)
        .withNot({ tokens: [String] }, throwError)
        .run();
    }

    return providerHasStoredTokens("expo", tokensByProvider);
  } catch (err) {
    throw new ProviderResponseError(err);
  }
};

export default handles;
