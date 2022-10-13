import {
  getBrandOverride,
  getChannelOverrides,
  getOverrides,
  getProviderOverrides,
} from "../get-overrides";

describe("getProviderOverrides method", () => {
  it("should return provider overrides from the message, if one exist", () => {
    const message = {
      template: "TEST",
      to: {
        email: "chris@courier.com",
      },
      providers: {
        sendgrid: {
          override: {
            body: {
              attatchments: [
                {
                  content: "eyJmb28iOiJiYXIifQ==",
                  type: "application/json",
                  filename: "lockheed.json",
                },
              ],
            },
          },
        },
        mailgun: {
          timeout: 2000,
        },
      },
    };

    const result = getProviderOverrides(message);

    const expected = {
      sendgrid: {
        body: {
          attatchments: [
            {
              content: "eyJmb28iOiJiYXIifQ==",
              type: "application/json",
              filename: "lockheed.json",
            },
          ],
        },
      },
    };

    expect(result).toEqual(expected);
  });

  it("should return provider overrides from the message, if multiple exist", () => {
    const message = {
      template: "TEST",
      to: {
        email: "chris@courier.com",
      },
      providers: {
        sendgrid: {
          override: {
            body: {
              attatchments: [
                {
                  content: "eyJmb28iOiJiYXIifQ==",
                  type: "application/json",
                  filename: "lockheed.json",
                },
              ],
            },
          },
        },
        mailgun: {
          override: {
            attachments: [
              {
                data: "eyJmb28iOiJiYXIifQ==",
                contentType: "application/json",
                filename: "lockheed.json",
              },
            ],
          },
        },
      },
    };

    const result = getProviderOverrides(message);
    const expected = {
      sendgrid: {
        body: {
          attatchments: [
            {
              content: "eyJmb28iOiJiYXIifQ==",
              type: "application/json",
              filename: "lockheed.json",
            },
          ],
        },
      },
      mailgun: {
        attachments: [
          {
            data: "eyJmb28iOiJiYXIifQ==",
            contentType: "application/json",
            filename: "lockheed.json",
          },
        ],
      },
    };

    expect(result).toEqual(expected);
  });

  it("should return undefined from the message, if no provider overrides exist", () => {
    const message = {
      template: "TEST",
      to: {
        email: "chris@courier.com",
      },
      providers: {
        sendgrid: {
          timeout: 2000,
        },
      },
    };

    const result = getProviderOverrides(message);

    expect(result).toEqual(undefined);
  });

  it("should return undefined from the message, if `providers` does not exist", () => {
    const message = {
      template: "TEST",
      to: {
        email: "chris@courier.com",
      },
    };

    const result = getProviderOverrides(message);

    expect(result).toEqual(undefined);
  });
});

describe("channelOverrides() method", () => {
  it("should return channel overrides from the message, if one exist", () => {
    const message = {
      template: "TEST",
      to: {
        email: "chris@courier.com",
      },
      channels: {
        email: {
          override: {
            attachments: [
              {
                foo: "BAR",
              },
            ],
          },
        },
      },
    };

    const result = getChannelOverrides(message);

    const expected = {
      email: { attachments: [{ foo: "BAR" }] },
    };

    expect(result).toEqual(expected);
  });

  it("should return channel overrides from the message, if multiple exist", () => {
    const message = {
      template: "TEST",
      to: {
        email: "chris@courier.com",
      },
      channels: {
        email: {
          override: {
            attachments: [
              {
                foo: "BAR",
              },
            ],
          },
        },
        push: {
          override: {
            click_action: "foo",
          },
        },
      },
    };

    const result = getChannelOverrides(message);
    const expected = {
      email: { attachments: [{ foo: "BAR" }] },
      push: { click_action: "foo" },
    };

    expect(result).toEqual(expected);
  });

  it("should return undefined from the message, if no channel overrides exist", () => {
    const message = {
      template: "TEST",
      to: {
        email: "chris@courier.com",
      },
      channels: {
        push: {
          brand: "test_brand",
          if: "message.opened === true",
        },
      },
    };

    const result = getChannelOverrides(message);

    expect(result).toEqual(undefined);
  });

  it("should return undefined from the message, if `channels` does not exist", () => {
    const message = {
      template: "TEST",
      to: {
        email: "chris@courier.com",
      },
    };

    const result = getChannelOverrides(message);

    expect(result).toEqual(undefined);
  });
});

describe("getBrandOverride() method", () => {
  it("should return brand overrides from the message, if one exists", () => {
    const message = {
      template: "TEST",
      to: {
        email: "chris@courier.com",
      },
      channels: {
        email: {
          override: {
            brand: {
              settings: {
                email: {
                  header: {
                    barColor: "#674ea7",
                  },
                },
              },
            },
          },
        },
      },
    };

    const result = getBrandOverride(message);
    const expected = {
      settings: { email: { header: { barColor: "#674ea7" } } },
    };

    expect(result).toEqual(expected);
  });

  it("should return undefined, if channels does not exists", () => {
    const message = {
      template: "TEST",
      to: {
        email: "chris@courier.com",
      },
    };

    const result = getBrandOverride(message);

    expect(result).toBeUndefined();
  });

  it("should return undefined, if channels.emails does not exists", () => {
    const message = {
      template: "TEST",
      to: {
        email: "chris@courier.com",
      },
      channels: {
        push: {
          override: {
            brand: {
              settings: {
                email: {
                  header: {
                    barColor: "#674ea7",
                  },
                },
              },
            },
          },
        },
      },
    };

    const result = getBrandOverride(message);

    expect(result).toBeUndefined();
  });

  it("should return undefined, if channels.emails.override does not exists", () => {
    const message = {
      template: "TEST",
      to: {
        email: "chris@courier.com",
      },
      channels: {
        email: {
          brand_id: "foo",
        },
      },
    };

    const result = getBrandOverride(message);

    expect(result).toBeUndefined();
  });
});

describe("getOverrides() method", () => {
  it("should return channel overrides from the messsge, if one exists", () => {
    const message = {
      template: "TEST",
      to: {
        email: "chris@courier.com",
      },
      channels: {
        email: {
          override: {
            attachments: [
              {
                foo: "BAR",
              },
            ],
          },
        },
      },
    };

    const result = getOverrides(message);
    const expected = {
      channels: {
        email: { attachments: [{ foo: "BAR" }] },
      },
    };
    expect(result?.providers).toBeUndefined();
    expect(result).toEqual(expected);
  });

  it("should return provider overrides from the message, if one exists", () => {
    const message = {
      template: "TEST",
      to: {
        email: "chris@courier.com",
      },
      providers: {
        sendgrid: {
          override: {
            body: {
              attatchments: [
                {
                  content: "eyJmb28iOiJiYXIifQ==",
                  type: "application/json",
                  filename: "lockheed.json",
                },
              ],
            },
          },
        },
        mailgun: {
          timeout: 2000,
        },
      },
    };

    const result = getOverrides(message);
    const expected = {
      providers: {
        sendgrid: {
          body: {
            attatchments: [
              {
                content: "eyJmb28iOiJiYXIifQ==",
                type: "application/json",
                filename: "lockheed.json",
              },
            ],
          },
        },
      },
    };
    expect(result.channels).toBeUndefined();
    expect(result).toEqual(expected);
  });

  it("should return both channel and provider overrides from the message, if both exist", () => {
    const message = {
      template: "TEST",
      to: {
        email: "chris@courier.com",
      },
      channels: {
        email: {
          override: {
            attachments: [
              {
                foo: "BAR",
              },
            ],
          },
        },
      },
      providers: {
        sendgrid: {
          override: {
            body: {
              attatchments: [
                {
                  content: "eyJmb28iOiJiYXIifQ==",
                  type: "application/json",
                  filename: "lockheed.json",
                },
              ],
            },
          },
        },
        mailgun: {
          timeout: 2000,
        },
      },
    };

    const result = getOverrides(message);
    const expected = {
      channels: {
        email: { attachments: [{ foo: "BAR" }] },
      },
      providers: {
        sendgrid: {
          body: {
            attatchments: [
              {
                content: "eyJmb28iOiJiYXIifQ==",
                type: "application/json",
                filename: "lockheed.json",
              },
            ],
          },
        },
      },
    };
    expect(result).toEqual(expected);
  });

  it("should return undefined if no overrides exists", () => {
    const message = {
      template: "TEST",
      to: {
        email: "chris@courier.com",
      },
    };

    const result = getOverrides(message);

    expect(result?.providers).toBeUndefined();
    expect(result?.providers?.sendgrid).toBeUndefined();
    expect(result?.channels).toBeUndefined();
    expect(result).toBeUndefined();
  });
});
