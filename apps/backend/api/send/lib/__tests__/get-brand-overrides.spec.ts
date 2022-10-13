import { IBrand } from "~/types.api";
import { ApiSendRequest, ApiSendRequestOverride } from "~/types.public";
import { getBrandOverrides } from "../translate-request";

describe("get brand overrides", () => {
  it("should return the brand override from a V1 request", () => {
    const override = {
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

    const result = getBrandOverrides(request);

    const expected: Partial<IBrand> = {
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
      // create a channel mapping fo lookup
    };

    const result = getBrandOverrides(request);

    const expected = undefined;

    expect(result).toStrictEqual(expected);
  });

  it("should return undefined if no brand override exists", () => {
    const override = {} as unknown as ApiSendRequestOverride;

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
      override,
    };

    const result = getBrandOverrides(request);

    const expected = undefined;

    expect(result).toStrictEqual(expected);
  });
});
