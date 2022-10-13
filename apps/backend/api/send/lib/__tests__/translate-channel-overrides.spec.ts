import { ApiSendRequest, ApiSendRequestOverride } from "~/types.public";
import { MessageChannels } from "../../types";
import { translateChannelOverrides } from "../translate-request";

describe("get channel overrides", () => {
  it("should return a translated email channel override", () => {
    const override = {
      channel: {
        email: {
          attachments: [
            {
              filename: "mock_filename",
              contentType: "mock_contentType",
              data: "mok_data",
            },
          ],
          bcc: "mock_bcc",
          cc: "mock_cc",
          from: "mock_from",
          html: "mock_html",
          replyTo: "mock_replyTo",
          subject: "mock_subject",
          text: "mock_text",
          tracking: {
            open: false,
          },
        },
      },
    } as unknown as ApiSendRequestOverride;

    const request: ApiSendRequest = {
      brand: "MY_BRAND_ID",
      data: {
        foo: {
          bar: "baz",
        },
      },
      event: "MY_TEMPLATE",
      recipient: "MY_USER_ID",
      // create a channel mapping fo lookup
      override,
    };

    const result = translateChannelOverrides(request);

    const expected: MessageChannels = {
      email: {
        override: {
          attachments: [
            {
              filename: "mock_filename",
              contentType: "mock_contentType",
              data: "mok_data",
            },
          ],
          bcc: "mock_bcc",
          cc: "mock_cc",
          from: "mock_from",
          html: "mock_html",
          reply_to: "mock_replyTo",
          subject: "mock_subject",
          text: "mock_text",
          tracking: {
            open: false,
          },
        },
      },
    };

    expect(result).toStrictEqual(expected);
  });

  it("should return a translated push and email channel override", () => {
    const override = {
      channel: {
        email: {
          attachments: [
            {
              filename: "mock_filename",
              contentType: "mock_contentType",
              data: "mok_data",
            },
          ],
          bcc: "mock_bcc",
          cc: "mock_cc",
          from: "mock_from",
          html: "mock_html",
          replyTo: "mock_replyTo",
          subject: "mock_subject",
          text: "mock_text",
          tracking: {
            open: false,
          },
        },
        push: {
          icon: "mock_icon",
          title: "mock_title",
          body: "mock_body",
          clickAction: "mock_clickAction",
          data: {
            foo: {
              bar: {
                baz: "boo",
              },
            },
          },
        },
      },
    } as unknown as ApiSendRequestOverride;

    const request: ApiSendRequest = {
      brand: "MY_BRAND_ID",
      data: {
        foo: {
          bar: "baz",
        },
      },
      event: "MY_TEMPLATE",
      recipient: "MY_USER_ID",
      // create a channel mapping fo lookup
      override,
    };

    const result = translateChannelOverrides(request);

    const expected: MessageChannels = {
      push: {
        override: {
          icon: "mock_icon",
          title: "mock_title",
          body: "mock_body",
          click_action: "mock_clickAction",
          data: {
            foo: {
              bar: {
                baz: "boo",
              },
            },
          },
        },
      },
      email: {
        override: {
          attachments: [
            {
              filename: "mock_filename",
              contentType: "mock_contentType",
              data: "mok_data",
            },
          ],
          bcc: "mock_bcc",
          cc: "mock_cc",
          from: "mock_from",
          html: "mock_html",
          reply_to: "mock_replyTo",
          subject: "mock_subject",
          text: "mock_text",
          tracking: {
            open: false,
          },
        },
      },
    };

    expect(result).toStrictEqual(expected);
  });

  it("should return undefined if no override exists", () => {
    const request: ApiSendRequest = {
      brand: "MY_BRAND_ID",
      data: {
        foo: {
          bar: "baz",
        },
      },
      event: "MY_TEMPLATE",
      recipient: "MY_USER_ID",
      // create a channel mapping fo lookup
    };

    const result = translateChannelOverrides(request);

    const expected = undefined;

    expect(result).toStrictEqual(expected);
  });

  it("should return undefined if no channel overrides exist", () => {
    const override = {} as unknown as ApiSendRequestOverride;

    const request: ApiSendRequest = {
      brand: "MY_BRAND_ID",
      data: {
        foo: {
          bar: "baz",
        },
      },
      event: "MY_TEMPLATE",
      recipient: "MY_USER_ID",
      // create a channel mapping fo lookup
      override,
    };

    const result = translateChannelOverrides(request);

    const expected = undefined;

    expect(result).toStrictEqual(expected);
  });
});
