import { ApiSendRequest, ApiSendRequestOverride } from "~/types.public";
import { RequestV2 } from "../../types";
import { translateRequest } from "../translate-request";

describe("translate request", () => {
  it("should translate a v1 request into a v2 request", async () => {
    const override = {
      mailgun: {
        body: {
          "o:tag": "notifications",
        },
        config: {
          apiKey: "<your API Key>",
          domain: "<domain>",
          host: "<host>",
        },
      },
      channel: {
        email: {
          attachments: [],
          bcc: "",
          cc: "",
          from: "",
          html: "",
          replyTo: "",
          subject: "",
          text: "",
          tracking: {
            open: false,
          },
        },
      },
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
    } as unknown as ApiSendRequestOverride;

    const request: ApiSendRequest = {
      brand: "MY_BRAND_ID",
      data: {
        foo: {
          bar: "baz",
        },
      },
      event: "MY_TEMPLATE",
      preferences: {
        categories: {
          abc: {
            status: "OPTED_IN",
            rules: [
              {
                until: "FOO",
                type: "snooze",
              },
            ],
            channel_preferences: [
              {
                channel: "email",
              },
            ],
            source: "recipient",
          },
        },
        notifications: {
          template_id_123: {
            status: "OPTED_IN",
            rules: [
              {
                until: "FOO",
                type: "snooze",
              },
            ],
            channel_preferences: [
              {
                channel: "email",
              },
            ],
            source: "recipient",
          },
        },
        templateId: "MY_TEMPLATE",
      },
      profile: {
        email: "USER@EMAIL.COM",
        phone_number: "123456789",
        firebaseToken: "abcd",
        slack: {
          access_token: "xoxb-xxxxx",
          email: "user@example.com",
        },
      },
      recipient: "MY_USER_ID",
      // create a channel mapping fo lookup
      override,
    };

    const result = await translateRequest({
      request,
      tenantId: "foo",
      traceId: "bar",
    });

    const expected: RequestV2 = {
      message: {
        to: {
          user_id: "MY_USER_ID",
          email: "USER@EMAIL.COM",
          phone_number: "123456789",
          firebaseToken: "abcd",
          slack: {
            access_token: "xoxb-xxxxx",
            email: "user@example.com",
          },
          preferences: {
            categories: {
              abc: {
                status: "OPTED_IN",
                rules: [
                  {
                    until: "FOO",
                    type: "snooze",
                  },
                ],
                channel_preferences: [
                  {
                    channel: "email",
                  },
                ],
                source: "recipient",
              },
            },
            notifications: {
              template_id_123: {
                status: "OPTED_IN",
                rules: [
                  {
                    until: "FOO",
                    type: "snooze",
                  },
                ],
                channel_preferences: [
                  {
                    channel: "email",
                  },
                ],
                source: "recipient",
              },
            },
            templateId: "MY_TEMPLATE",
          },
        },
        template: "MY_TEMPLATE",
        brand_id: "MY_BRAND_ID",
        data: {
          foo: {
            bar: "baz",
          },
        },
        channels: {
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
              attachments: [],
              bcc: "",
              cc: "",
              from: "",
              html: "",
              reply_to: "",
              subject: "",
              text: "",
              tracking: {
                open: false,
              },
            },
          },
        },
        providers: {
          mailgun: {
            override: {
              body: {
                "o:tag": "notifications",
              },
              config: {
                apiKey: "<your API Key>",
                domain: "<domain>",
                host: "<host>",
              },
            },
          },
        },
      },
    };

    expect(result).toStrictEqual(expected);
  });
});
