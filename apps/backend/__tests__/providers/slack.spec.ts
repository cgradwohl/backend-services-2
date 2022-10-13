import { ErrorCode } from "@slack/web-api";

import {
  ProviderResponseError,
  RetryableProviderResponseError,
} from "~/providers/errors";
import slack from "~/providers/slack";
import { ISlackBotProfile, slackBotSend } from "~/providers/slack/bot";

const openSpy = jest.fn();
const postMessageSpy = jest.fn();
const updateSpy = jest.fn();
const lookupByEmailSpy = jest.fn();

jest.mock("@slack/web-api", () => {
  return {
    ...jest.requireActual("@slack/web-api"),
    WebClient: jest.fn(() => ({
      chat: {
        open: openSpy,
        postMessage: postMessageSpy,
        update: updateSpy,
      },
      conversations: {
        open: openSpy,
      },
      users: {
        lookupByEmail: lookupByEmailSpy,
      },
    })),
  };
});

describe("when sending via bot", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const cases: ReadonlyArray<
    [
      ErrorCode,
      (
        | typeof ProviderResponseError
        | typeof RetryableProviderResponseError
        | typeof Error
      )
    ]
  > = [
    [ErrorCode.PlatformError, ProviderResponseError],
    [ErrorCode.HTTPError, RetryableProviderResponseError],
    [ErrorCode.RateLimitedError, RetryableProviderResponseError],
    [ErrorCode.RequestError, RetryableProviderResponseError],
    [undefined, Error],
  ];

  for (const [code, err] of cases) {
    it(`will throw ${err.name} if code is ${code}`, async () => {
      openSpy.mockRejectedValue(code ? { ok: false, code } : new Error());
      const profile: ISlackBotProfile = {
        access_token: "token",
        user_id: "user id",
      };

      await expect(
        slackBotSend(profile, { blocks: [], text: "" }, "1.000000")
      ).rejects.toBeInstanceOf(err);
    });
  }

  it("will pass in unfurl_links to the request", async () => {
    openSpy.mockResolvedValue({ channel: { id: "42" } });
    const profile: ISlackBotProfile = {
      access_token: "token",
      user_id: "user id",
    };

    await slackBotSend(
      profile,
      { blocks: [], text: "", unfurl_links: false, unfurl_media: false },
      null
    );

    expect(postMessageSpy.mock.calls[0][1]).toBe(undefined);
  });
});

describe("when getting delivered timestamp", () => {
  it("will return undefined if string is not parseable", () => {
    const providerSentResponse = "[Truncated] sadfasdafadsfs";

    expect(() => slack.getDeliveredTimestamp(providerSentResponse)).toThrow();
  });
});

describe("when getting reference", () => {
  it("will return MessageID if there is sentData", () => {
    const providerSentResponse = {
      channel: "ABC12345",
      ts: "1602034627.000700",
    };

    const result = slack.getReference(providerSentResponse, undefined);

    expect(result).toStrictEqual({
      channel: "ABC12345",
      ts: "1602034627.000700",
    });
  });

  it("will return undefined if sentData is undefined", () => {
    const result = slack.getReference(undefined, undefined);

    expect(result).toStrictEqual({
      channel: undefined,
      ts: undefined,
    });
  });
});
