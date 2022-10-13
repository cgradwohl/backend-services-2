import { IBrand } from "~/types.api";
import { MessageChannels } from "../../types";
import { extendChannelsWithBrandOverrides } from "../translate-request";

describe("extend channles with brand overrides", () => {
  it("should return and extend channels with brand override", () => {
    const channels: MessageChannels = {
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

    const brandOveride: Partial<IBrand> = {
      settings: {
        email: {
          header: {
            logo: {
              image: "https://www.courier.com/logo.png",
              href: "https://www.courier.com",
            },
            barColor: "ff5d5e",
          },
        },
      },
    };

    const result = extendChannelsWithBrandOverrides(channels, brandOveride);

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
          brand: {
            settings: {
              email: {
                header: {
                  logo: {
                    image: "https://www.courier.com/logo.png",
                    href: "https://www.courier.com",
                  },
                  barColor: "ff5d5e",
                },
              },
            },
          },
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

  it("should return message channels if message channels exist but no brand override exists", () => {
    const channels: MessageChannels = {
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

    const brandOveride = undefined;

    const result = extendChannelsWithBrandOverrides(channels, brandOveride);

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

  it("should return undefined if no message channels and no brand override exists", () => {
    const channels = undefined;

    const brandOveride = undefined;

    const result = extendChannelsWithBrandOverrides(channels, brandOveride);

    const expected = undefined;

    expect(result).toStrictEqual(expected);
  });

  it("should return message channels if no message channels exists but brand override do exists", () => {
    const channels = undefined;

    const brandOveride: Partial<IBrand> = {
      settings: {
        email: {
          header: {
            logo: {
              image: "https://www.courier.com/logo.png",
              href: "https://www.courier.com",
            },
            barColor: "ff5d5e",
          },
        },
      },
    };

    const result = extendChannelsWithBrandOverrides(channels, brandOveride);

    const expected: MessageChannels = {
      email: {
        override: {
          brand: {
            settings: {
              email: {
                header: {
                  logo: {
                    image: "https://www.courier.com/logo.png",
                    href: "https://www.courier.com",
                  },
                  barColor: "ff5d5e",
                },
              },
            },
          },
        },
      },
    };

    expect(result).toStrictEqual(expected);
  });
});
