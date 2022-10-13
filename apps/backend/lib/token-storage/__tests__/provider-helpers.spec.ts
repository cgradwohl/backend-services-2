import { evaluateTokenFreshness } from "~/lib/token-storage";
import {
  getTokensForProvider,
  providerHasStoredTokens,
  standardProfileTokenExtractor,
} from "../provider-helpers";

jest.mock("~/lib/token-storage/token-storage");

const mockEvaluateTokenFreshness = evaluateTokenFreshness as jest.Mock;

describe("provider token helpers", () => {
  afterEach(jest.clearAllMocks);

  describe("getTokensForProvider", () => {
    it("should return unique tokens from profile", async () => {
      const profile = {
        apn: {
          tokens: ["token1", "token2", "token2"],
        },
      };

      const result = await getTokensForProvider({
        params: { profile } as any,
        providerKey: "apn",
        profileTokenExtractor: (profile) =>
          standardProfileTokenExtractor("apn", profile),
        maxTokenAgeMs: 50000,
      });
      expect(mockEvaluateTokenFreshness).toBeCalledTimes(0);
      expect(result).toEqual({
        tokens: ["token1", "token2"],
        isManaged: false,
      });
    });

    it("should return tokens from variableData", async () => {
      const variableData = {
        tokens: {
          apn: [{ token: "token1" }, { token: "token2" }],
        },
      };
      mockEvaluateTokenFreshness.mockResolvedValueOnce(["token1", "token2"]);

      const result = await getTokensForProvider({
        params: { profile: {}, variableData } as any,
        providerKey: "apn",
        profileTokenExtractor: (profile) =>
          standardProfileTokenExtractor("apn", profile),
        maxTokenAgeMs: 50000,
      });

      expect(mockEvaluateTokenFreshness).toHaveBeenCalledWith(
        variableData.tokens.apn,
        50000
      );
      expect(result).toEqual({
        tokens: ["token1", "token2"],
        isManaged: true,
      });
    });

    it("should return empty unmanaged tokens", async () => {
      const variableData = { tokens: {} };

      const result = await getTokensForProvider({
        params: { profile: {}, variableData } as any,
        providerKey: "apn",
        profileTokenExtractor: (profile) =>
          standardProfileTokenExtractor("apn", profile),
        maxTokenAgeMs: 50000,
      });

      expect(mockEvaluateTokenFreshness).toHaveBeenCalledTimes(0);
      expect(result).toEqual({
        tokens: [],
        isManaged: false,
      });
    });
  });

  describe("standardTokenProfileExtractor", () => {
    it("should return tokens from profile given tokens", () => {
      const profile = {
        apn: {
          tokens: ["token1", "token2"],
        },
      };

      const result = standardProfileTokenExtractor("apn", profile);
      expect(result).toEqual(["token1", "token2"]);
    });

    it("should return tokens from profile given token", () => {
      const profile = {
        apn: {
          token: "token1",
        },
      };

      const result = standardProfileTokenExtractor("apn", profile);
      expect(result).toEqual(["token1"]);
    });

    it("should return tokens from profile given tokens as string", () => {
      const profile = {
        apn: {
          tokens: "token1",
        },
      };

      const result = standardProfileTokenExtractor("apn", profile);
      expect(result).toEqual(["token1"]);
    });

    it("should return undefined when no provider on profile", () => {
      const profile = {};
      const result = standardProfileTokenExtractor("apn", profile);
      expect(result).toEqual(undefined);
    });
  });

  describe("providerHasStoredTokens", () => {
    it("should return true when provider has a token", () => {
      expect(
        providerHasStoredTokens("expo", { expo: [{ token: "123" } as any] })
      ).toEqual(true);
    });

    it("should return true when provider doesn't have a token", () => {
      expect(providerHasStoredTokens("expo", { expo: [] })).toEqual(false);
      expect(providerHasStoredTokens("expo", {})).toEqual(false);
      expect(providerHasStoredTokens("expo")).toEqual(false);
    });
  });
});
