import { clone } from "~/lib/utils";
import { validateV2Request } from "../validate-v2-request";

describe("api v2 validation", () => {
  it("should throw if neither message or sequence is provided", async () => {
    await expect(
      validateV2Request(
        {
          foo: "",
        },
        "tenantId"
      )
    ).rejects.toThrow();
  });

  it("should throw if both message or sequence are provided", async () => {
    await expect(
      validateV2Request(
        {
          sequence: [],
          message: {},
        },
        "tenantId"
      )
    ).rejects.toThrow();
  });
  describe("sequence", () => {
    it("should throw if passed an invalid sequence action", async () => {
      await expect(
        validateV2Request(
          {
            sequence: [
              {
                action: "foo",
                message: {
                  to: {
                    email: "foo@gmail.com",
                  },
                  content: {
                    title: "foo",
                    body: "bar",
                  },
                },
              },
            ],
          },
          "tenantId"
        )
      ).rejects.toThrow();
    });

    it("should allow a valid sequence action", async () => {
      await expect(
        validateV2Request(
          {
            sequence: [
              {
                action: "send",
                message: {
                  to: {
                    email: "foo@gmail.com",
                  },
                  content: {
                    title: "foo",
                    body: "bar",
                  },
                },
              },
            ],
          },
          "tenantId"
        )
      ).resolves.not.toThrow();
    });
  });
  describe("message", () => {
    it("should throw if passed an elements array without a version", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: [
                {
                  email: "drew@courier.com",
                },
                {
                  email: "suhascourier.com",
                },
                {
                  email: "tejas@courier.com",
                },
              ],
              content: {
                elements: [
                  {
                    type: "meta",
                    title: "FOO",
                  },
                ],
              },
            },
          },
          "tenantId"
        )
      ).rejects.toThrow();
    });

    it("should not throw if passed title and body with no version", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: [
                {
                  email: "drew@courier.com",
                },
                {
                  email: "suhascourier.com",
                },
                {
                  email: "tejas@courier.com",
                },
              ],
              content: {
                title: "FOO",
                body: "BAR",
              },
            },
          },
          "tenantId"
        )
      ).resolves.not.toThrow();
    });

    it("should not throw if passed a request of ad hoc recipients", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: [
                {
                  user_id: "123",
                },
              ],
              template: "XV6X2VWN2BM1B7NWAQ2H1Q9PTH6H",
            },
          },
          "tenantId"
        )
      ).resolves.not.toThrow();
    });

    it("should not throw if validate is passed a valid request", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: {
                email: "drew@courier.com",
              },
              template: "XV6X2VWN2BM1B7NWAQ2H1Q9PTH6H",
            },
          },
          "tenantId"
        )
      ).resolves.not.toThrow();
    });

    it("should throw if content *and* template is defined", async () => {
      expect(
        validateV2Request(
          {
            message: {
              content: {},
              template: "XV6X2VWN2BM1B7NWAQ2H1Q9PTH6H",
              to: { email: "me@me.com" },
            },
          },
          "tenantId"
        )
      ).rejects.toThrow(
        "Invalid Request. Either 'content' or 'template' may be defined, but not both."
      );
    });

    it("should throw if *neither* content *or* template is defined", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "me@me.com" },
            },
          },
          "tenantId"
        )
      ).rejects.toThrow(
        "Invalid Request. Either 'content' or 'template' must be defined."
      );
    });

    it("should throw if message.content does not have one of title, body, html or plain", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: {
                email: "drew@courier.com",
              },
              content: {},
            },
          },
          "tenantId"
        )
      ).rejects.toThrow(
        "Invalid Request. 'content' must contain one of the following properties: 'title', 'body', or 'elements'"
      );
      await expect(
        validateV2Request(
          {
            message: {
              to: {
                email: "drew@courier.com",
              },
              content: { body: "" },
            },
          },
          "tenantId"
        )
      ).resolves.not.toThrow();
    });

    it("should throw if message.template is not of type string", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: {
                email: "",
              },
              template: {},
            },
          },
          "tenantId"
        )
      ).rejects.toThrow("Invalid Request. 'template' must be of type string.");
    });

    it("should throw if message.brand_id is not of type string", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: {
                email: "drew@courier.com",
              },
              template: "XV6X2VWN2BM1B7NWAQ2H1Q9PTH6H",
              brand_id: {},
            },
          },
          "tenantId"
        )
      ).rejects.toThrow(
        "Invalid definition for property 'brand_id'. 'brand_id' must be of type string."
      );
      await expect(
        validateV2Request(
          {
            message: {
              to: {
                email: "drew@courier.com",
              },
              template: "XV6X2VWN2BM1B7NWAQ2H1Q9PTH6H",
              brand_id: "foo",
            },
          },
          "tenantId"
        )
      ).resolves.not.toThrow();
    });
  });

  describe("ad hoc", () => {
    it("should not throw if passed a valid request of ad hoc recipients", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: [
                {
                  email: "drew@courier.com",
                },
                {
                  email: "suhascourier.com",
                },
                {
                  email: "tejas@courier.com",
                },
              ],
              template: "XV6X2VWN2BM1B7NWAQ2H1Q9PTH6H",
            },
          },
          "tenantId"
        )
      ).resolves.not.toThrow();
    });
    it("should throw if passed an invalid request of ad hoc recipients", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: [
                {
                  user_id: "123",
                  list_id: "abc",
                },
                {
                  user_id: "1234",
                  list_id: "abc4",
                },
              ],
              template: "XV6X2VWN2BM1B7NWAQ2H1Q9PTH6H",
            },
          },
          "tenantId"
        )
      ).rejects.toThrow();
    });
  });

  describe("routing", () => {
    it("should throw if message.routing.channels has an unknown channel", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "XV6X2VWN2BM1B7NWAQ2H1Q9PTH6H",
              channels: {
                method: "all",
                channels: ["bloop"],
              },
            },
          },
          "tenantId"
        )
      ).rejects.toThrow();
    });

    it("should not throw if message.routing.channels only has known channels including providers", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "XV6X2VWN2BM1B7NWAQ2H1Q9PTH6H",
              routing: {
                method: "all",
                channels: ["email", "push", "sms", "slack", "mailjet"],
              },
            },
          },
          "tenantId"
        )
      ).resolves.not.toThrow();
    });
  });

  describe("channels", () => {
    it("should throw if message.channels is not an object", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "test@test.com" },
              template: "XV6X2VWN2BM1B7NWAQ2H1Q9PTH6H",
              channels: "",
            },
          },
          "tenantId"
        )
      ).rejects.toThrow(
        "Invalid definition for property 'channels'. 'channels' must be of type object."
      );
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "XV6X2VWN2BM1B7NWAQ2H1Q9PTH6H",
              channels: { email: {} },
            },
          },
          "tenantId"
        )
      ).resolves.not.toThrow();
    });

    it("should throw if message.channels contains invalid keys", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "XV6X2VWN2BM1B7NWAQ2H1Q9PTH6H",
              channels: { email: {}, foo: {} },
            },
          },
          "tenantId"
        )
      ).rejects.toThrow(
        "Invalid Request. 'foo' is not a valid property of 'message.channels'."
      );
    });

    it("should throw if message.channels contains many invalid keys", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "XV6X2VWN2BM1B7NWAQ2H1Q9PTH6H",
              channels: { email: {}, foo: {}, bar: {} },
            },
          },
          "tenantId"
        )
      ).rejects.toThrow(
        "Invalid Request. 'foo, bar' are not valid properties of 'message.channels'."
      );
    });
  });

  describe("to", () => {
    it("should throw if message.to.data is an array", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: {
                email: "foo@courier.com",
                data: [
                  {
                    name: "foo",
                  },
                ],
              },
              content: {
                elements: [
                  {
                    type: "meta",
                    title: "FOO",
                  },
                ],
              },
            },
          },
          "tenantId"
        )
      ).rejects.toThrow();
    });

    it("should throw if message.to.data is an array", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: [
                {
                  email: "bar@courier.com",
                },
                {
                  email: "foo@courier.com",
                  data: [
                    {
                      name: "foo",
                    },
                  ],
                },
              ],
              content: {
                elements: [
                  {
                    type: "meta",
                    title: "FOO",
                  },
                ],
              },
            },
          },
          "tenantId"
        )
      ).rejects.toThrow();
    });

    it("should throw if message.to is not defined", async () => {
      await expect(
        validateV2Request(
          { message: { template: "XV6X2VWN2BM1B7NWAQ2H1Q9PTH6H" } },
          "tenantId"
        )
      ).rejects.toThrow("Invalid Request. The 'to' property is required.");
    });

    it("should not throw if message.to is empty", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              template: "XV6X2VWN2BM1B7NWAQ2H1Q9PTH6H",
              to: {},
            },
          },
          "tenantId"
        )
      ).resolves.not.toThrow(
        "Invalid Request. The 'to' property must not be empty."
      );
    });
  });

  describe("content", () => {
    it("should throw if message.content.body or message.content.elements is not defined", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              content: {},
              routing: {
                method: "all",
                channels: ["email", "push", "sms", "slack", "mailjet"],
              },
            },
          },
          "tenantId"
        )
      ).rejects.toThrow();
    });
  });

  describe("data", () => {
    it("should throw if message.data is an array", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: [
                {
                  email: "drew@courier.com",
                },
                {
                  email: "suhascourier.com",
                },
                {
                  email: "tejas@courier.com",
                },
              ],
              data: [
                {
                  name: "foo",
                },
              ],
              content: {
                elements: [
                  {
                    type: "meta",
                    title: "FOO",
                  },
                ],
              },
            },
          },
          "tenantId"
        )
      ).rejects.toThrow();
    });

    it("should throw if message.data is not an object.", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "foo",
              data: "",
            },
          },
          "tenantId"
        )
      ).rejects.toThrow();
    });

    it("should not throw if message.data is not defined.", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "foo",
            },
          },
          "tenantId"
        )
      ).resolves.not.toThrow();
    });
  });

  describe("metadata", () => {
    it("should throw if metadata contains an invalid key", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "foo",
              metadata: {
                foo: {
                  bar: "baz",
                },
              },
            },
          },
          "tenantId"
        )
      ).rejects.toThrowError(
        "Invalid Request. 'foo' is not a valid property of 'message.metadata'."
      );
    });

    it("should throw if metadata.event is not a string.", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "foo",
              metadata: {
                event: {
                  test: "foo",
                },
              },
            },
          },
          "tenantId"
        )
      ).rejects.toThrow();
    });

    it("should not throw if metadata.event is a string.", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "foo",
              metadata: {
                event: "bar",
              },
            },
          },
          "tenantId"
        )
      ).resolves.not.toThrow();
    });

    it("should throw if metadata.trace_id is not a string.", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "foo",
              metadata: {
                trace_id: {
                  harry: "potter",
                },
              },
            },
          },
          "tenantId"
        )
      ).rejects.toThrowError(
        "Invalid definition for property 'metadata.trace_id'. 'trace_id' must be of type string."
      );
    });

    it("should not throw if metadata.trace_id is a string.", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "foo",
              metadata: {
                trace_id: "Gryffindor-for-the-win",
              },
            },
          },
          "tenantId"
        )
      ).resolves.not.toThrow();
    });

    it("should throw if metadata.trace_id is a number.", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "foo",
              metadata: {
                trace_id: 123456789,
              },
            },
          },
          "tenantId"
        )
      ).rejects.toThrowError(
        "Invalid definition for property 'metadata.trace_id'. 'trace_id' must be of type string."
      );
    });

    it("should throw if metadata.trace_id is greater than 36 characters.", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "foo",
              metadata: {
                trace_id: "harry potter".repeat(10),
              },
            },
          },
          "tenantId"
        )
      ).rejects.toThrowError(
        "Invalid definition for property 'metadata.trace_id'. Trace ID cannot be longer than 36 characters."
      );
    });

    it("should not throw if metadata.tags has 9 items or less.", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "foo",
              metadata: {
                tags: Array.from({ length: 9 }).map((i) => `tag-${i}`),
              },
            },
          },
          "tenantId"
        )
      ).resolves.not.toThrow();
    });

    it("should throw if metadata.tags has more than 9 items.", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "foo",
              metadata: {
                tags: Array.from({ length: 10 }).map((i) => `tag-${i}`),
              },
            },
          },
          "tenantId"
        )
      ).rejects.toThrow();
    });

    it("should throw if metadata.tags has an item longer than 30 characters", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "foo",
              metadata: {
                tags: ["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
              },
            },
          },
          "tenantId"
        )
      ).rejects.toThrow();
    });

    it("should throw if metadata.tags has an item longer than 256 characters for Color", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "foo",
              metadata: {
                tags: ["a".repeat(257)],
              },
            },
          },
          "8da7a9c6-f82b-46e7-ab55-b52d77ee8d6b"
        )
      ).rejects.toThrow();
    });

    it("should throw if metadata.utm is not an object.", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "foo",
              metadata: {
                utm: "baz",
              },
            },
          },
          "tenantId"
        )
      ).rejects.toThrow();
    });

    it("should throw if metadata.utm has invalid keys.", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "foo",
              metadata: {
                utm: {
                  bar: "baz",
                },
              },
            },
          },
          "tenantId"
        )
      ).rejects.toThrow();
    });

    it("should not throw if metadata.utm has valid keys.", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "foo",
              metadata: {
                utm: {
                  source: "bar",
                },
              },
            },
          },
          "tenantId"
        )
      ).resolves.not.toThrow();
    });

    it("should throw if metadata.utm has valid keys with invalid types.", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "foo",
              metadata: {
                utm: {
                  source: {
                    foo: "bar",
                  },
                },
              },
            },
          },
          "tenantId"
        )
      ).rejects.toThrow();
    });
  });

  describe("audience", () => {
    it("should throw if audience_id is mentioned but is falsy", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { audience_id: "" },
              template: "foo",
            },
          },
          "tenantId"
        )
      ).rejects.toThrowError("Invalid Request. The audience must be defined.");
    });

    it("should not throw if audience_id is mentioned defined", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { audience_id: "my-fav-pigeons" },
              template: "foo",
            },
          },
          "tenantId"
        )
      ).resolves.not.toThrow();
    });

    it("should throw if audience_id is not a string", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { audience_id: { foo: "bar" } },
              template: "foo",
            },
          },
          "tenantId"
        )
      ).rejects.toThrow();
    });
  });

  describe("providers validation", () => {
    const validateWithProviders = async (providers: any) =>
      validateV2Request(
        {
          message: {
            to: { email: "" },
            template: "foo",
            providers,
          },
        },
        "tenantId"
      );

    it("should not throw given valid providers", async () => {
      await expect(
        validateWithProviders({
          apn: {
            if: "hello === 3",
            timeout: 350,
            override: {
              someArbitraryKey: "someArbitraryValue",
            },
          },
        })
      ).resolves.not.toThrow();
    });

    it("should throw given invalid provider", async () => {
      await expect(
        validateWithProviders({
          foo: {
            if: "hello === 3",
            timeout: 350,
            override: {
              someArbitraryKey: "someArbitraryValue",
            },
          },
        })
      ).rejects.toThrow();
    });

    it("should throw given invalid provider field type", async () => {
      await expect(
        validateWithProviders({
          apn: {
            if: 4,
          },
        })
      ).rejects.toThrow();
    });
  });

  describe("timeout", () => {
    it("should throw if message.timeout is not a object.", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "foo",
              timeout: "this should not work",
            },
          },
          "tenantId"
        )
      ).rejects.toThrow();
    });

    it("should throw if message.timeout is not a valid object.", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "foo",
              timeout: {
                message: "this does not work",
              },
            },
          },
          "tenantId"
        )
      ).rejects.toThrow();
    });

    it("should throw if message.timeout.message is negative.", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "foo",
              timeout: {
                message: -1,
              },
            },
          },
          "tenantId"
        )
      ).rejects.toThrow();
    });

    it("should throw if message.timeout.message is outside the range of 72 hours.", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "foo",
              timeout: {
                message: 500000000,
              },
            },
          },
          "tenantId"
        )
      ).rejects.toThrow();
    });

    it("should throw if message.timeout.channel is not an object or number.", async () => {
      expect.assertions(3);

      const numericVersion: any = {
        message: {
          to: { email: "" },
          template: "foo",
          timeout: {
            channel: 1,
          },
        },
      };

      await expect(
        validateV2Request(numericVersion, "tenantId")
      ).resolves.not.toThrow();

      const objectVersion = clone(numericVersion);
      objectVersion.message.timeout.channel = {};
      await expect(
        validateV2Request(objectVersion, "tenantId")
      ).resolves.not.toThrow();

      const stringVersion = clone(numericVersion);
      stringVersion.message.timeout.channel = "";
      await expect(
        validateV2Request(stringVersion, "tenantId")
      ).rejects.toThrow();
    });

    it("should throw if message.timeout.channel.email is not a number.", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "foo",
              timeout: {
                channel: {
                  email: "notANumber",
                },
              },
            },
          },
          "tenantId"
        )
      ).rejects.toThrow();
    });

    it("should throw if message.timeout.channel.email is a number outside the valid range.", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "foo",
              timeout: {
                channel: {
                  email: -1,
                },
              },
            },
          },
          "tenantId"
        )
      ).rejects.toThrow();
    });

    it("should throw if message.timeout.provider is not an object.", async () => {
      expect.assertions(3);

      const numericVersion: any = {
        message: {
          to: { email: "" },
          template: "foo",
          timeout: {
            provider: 1,
          },
        },
      };

      await expect(
        validateV2Request(numericVersion, "tenantId")
      ).resolves.not.toThrow();
      const objectVersion = clone(numericVersion);
      objectVersion.message.timeout.provider = {};
      await expect(
        validateV2Request(objectVersion, "tenantId")
      ).resolves.not.toThrow();
      const stringVersion = clone(numericVersion);
      stringVersion.message.timeout.provider = "";
      await expect(
        validateV2Request(stringVersion, "tenantId")
      ).rejects.toThrow();
    });

    it("should throw if message.timeout.provider.sendgrid is not a number.", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "foo",
              timeout: {
                provider: {
                  sendgrid: "notANumber",
                },
              },
            },
          },
          "tenantId"
        )
      ).rejects.toThrow();
    });

    it("should throw if message.timeout.provider.sendgrid is a number outside the valid range.", async () => {
      await expect(
        validateV2Request(
          {
            message: {
              to: { email: "" },
              template: "foo",
              timeout: {
                provider: {
                  sendgrid: -1,
                },
              },
            },
          },
          "tenantId"
        )
      ).rejects.toThrow();
    });
  });
});
