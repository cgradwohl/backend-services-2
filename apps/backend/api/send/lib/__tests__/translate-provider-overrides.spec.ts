import { ApiSendRequest } from "~/types.public";
import { MessageProviders } from "../../types";
import { translateProviderOverrides } from "../translate-request";

describe("get provider overrides", () => {
  it("should return a translated mailgun provider override", () => {
    const request: ApiSendRequest = {
      brand: "MY_BRAND_ID",
      data: {
        foo: {
          bar: "baz",
        },
      },
      event: "MY_TEMPLATE",
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
      override: {
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
      },
    };

    const result = translateProviderOverrides(request);

    const expected: MessageProviders = {
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
    };

    expect(result).toStrictEqual(expected);
  });

  it("should return a translated mailgun, slack, and twilio provider overrides", () => {
    const request: ApiSendRequest = {
      brand: "MY_BRAND_ID",
      data: {
        foo: {
          bar: "baz",
        },
      },
      event: "MY_TEMPLATE",
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
      override: {
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
        slack: {
          body: {
            unfurl_links: true,
          },
        },
        twilio: {
          body: {
            to: "+109876543210",
          },
          config: {
            accountSid: "<your Account SID>",
            authToken: "<your Auth Token>",
            messagingServiceSid: "<your Messaging Service SID>",
          },
        },
      },
    };

    const result = translateProviderOverrides(request);

    const expected: MessageProviders = {
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
      slack: {
        override: {
          body: {
            unfurl_links: true,
          },
        },
      },
      twilio: {
        override: {
          body: {
            to: "+109876543210",
          },
          config: {
            accountSid: "<your Account SID>",
            authToken: "<your Auth Token>",
            messagingServiceSid: "<your Messaging Service SID>",
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
    };

    const result = translateProviderOverrides(request);

    const expected = undefined;

    expect(result).toStrictEqual(expected);
  });

  it("should return undefined if no provider overrides exist", () => {
    const request: ApiSendRequest = {
      brand: "MY_BRAND_ID",
      data: {
        foo: {
          bar: "baz",
        },
      },
      event: "MY_TEMPLATE",
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
      override: {},
    };

    const result = translateProviderOverrides(request);

    const expected = undefined;

    expect(result).toStrictEqual(expected);
  });
});
