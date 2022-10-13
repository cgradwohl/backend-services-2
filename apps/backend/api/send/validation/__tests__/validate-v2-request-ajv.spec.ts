// @ts-nocheck
import { CourierLogger } from "~/lib/logger";
import { validateV2RequestAjv } from "../validate-v2-request-ajv";

jest.mock("~/lib/logger", () => {
  return {
    CourierLogger: jest.fn().mockImplementation(() => {
      return {
        logger: {
          debug: jest.fn(),
        },
      };
    }),
  };
});

/** TODO: Move all non-duplicated test cases to validate-v2-request.spec.ts if AJV validation ever replaces hard-coded validation */
describe("api v2 validation - ajv", () => {
  describe("request", () => {
    it("should throw if neither message or sequence is provided", () => {
      doesThrow(
        {
          foo: "",
        },
        "Invalid Request. Either 'message' or 'sequence' must be defined."
      );
    });

    it("should throw if both message or sequence are provided", () => {
      doesThrow(
        {
          sequence: [
            {
              action: "send",
              message: {
                to: {
                  email: "email@email.com",
                },
                content: {
                  version: "2020-01-01",
                  elements: [
                    {
                      type: "meta",
                      title: "FOO",
                    },
                  ],
                },
              },
            },
          ],
          message: {
            to: {
              email: "email@email.com",
            },
            content: {
              version: "2020-01-01",
              elements: [
                {
                  type: "meta",
                  title: "FOO",
                },
              ],
            },
          },
        },
        "Invalid Request. The request cannot contain both a `sequence` and a `message` property."
      );
    });
  });

  describe("sequence", () => {
    it("should throw if passed an invalid sequence action", () => {
      doesThrow(
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
        "Invalid Request. Only 'send' action is supported at this time."
      );
    });

    it("should allow a valid sequence action", () => {
      doesNotThrow({
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
      });
    });
  });

  describe("message", () => {
    it("should throw if passed an elements array without a version", () => {
      doesThrow(
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
        "Invalid Request. 'message.content' must contain a 'version' property when using `content.elements`."
      );
    });

    it("should throw if an email is invalid", () => {
      doesThrow(
        {
          message: {
            to: {
              email: "",
            },
            content: {
              version: "2020-01-01",
              elements: [
                {
                  type: "meta",
                  title: "FOO",
                },
              ],
            },
          },
        },
        "Invalid Request. message.to.email is invalid."
      );
    });

    it("should not throw if passed title and body with no version", () => {
      doesNotThrow({
        message: {
          to: [
            {
              email: "drew@courier.com",
            },
            {
              email: "suhas@courier.com",
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
      });
    });

    it("should not throw if passed a request of ad hoc recipients", () => {
      doesNotThrow({
        message: {
          to: [
            {
              user_id: "123",
            },
          ],
          template: "XV6X2VWN2BM1B7NWAQ2H1Q9PTH6H",
        },
      });
    });

    it("should not throw if validateRequestWithAjv is passed a valid request", () => {
      doesNotThrow({
        message: {
          to: {
            email: "drew@courier.com",
          },
          template: "XV6X2VWN2BM1B7NWAQ2H1Q9PTH6H",
        },
      });
    });

    it("should throw if content is empty", () => {
      doesThrow(
        {
          message: {
            content: {},
            to: { email: "me@me.com" },
          },
        },
        "Invalid Request. 'content' must contain one of the following properties: 'title', 'body', or 'elements'"
      );
    });

    it("should throw if content *and* template is defined", () => {
      doesThrow(
        {
          message: {
            content: { body: "test" },
            template: "XV6X2VWN2BM1B7NWAQ2H1Q9PTH6H",
            to: { email: "me@me.com" },
          },
        },
        "Invalid Request. Either 'content' or 'template' may be defined, but not both."
      );
    });

    it("should throw if *neither* content *or* template is defined", () => {
      doesThrow(
        {
          message: {
            to: {
              email: "me@me.com",
            },
          },
        },
        "Invalid Request. Either 'content' or 'template' must be defined."
      );
    });

    it("should throw if message.content does not have one of title, body, html or plain", () => {
      doesThrow(
        {
          message: {
            to: {
              email: "drew@courier.com",
            },
            content: {},
          },
        },
        "Invalid Request. 'content' must contain one of the following properties: 'title', 'body', or 'elements'"
      );
    });

    it("should not throw if message.content has an empty body", () => {
      doesNotThrow({
        message: {
          to: {
            email: "drew@courier.com",
          },
          content: { body: "" },
        },
      });
    });

    it("should throw if message.template is not of type string", () => {
      doesThrow(
        {
          message: {
            to: {
              email: "",
            },
            template: {},
          },
        },
        "Invalid Request. 'template' must be of type string."
      );
    });

    it("should throw if message.brand_id is not of type string", () => {
      doesThrow(
        {
          message: {
            to: {
              email: "drew@courier.com",
            },
            template: "XV6X2VWN2BM1B7NWAQ2H1Q9PTH6H",
            brand_id: {},
          },
        },
        "Invalid definition for property 'brand_id'. 'brand_id' must be of type string."
      );
    });

    it("should not throw if message.brand_id is of type string", () => {
      doesNotThrow({
        message: {
          to: {
            email: "drew@courier.com",
          },
          template: "XV6X2VWN2BM1B7NWAQ2H1Q9PTH6H",
          brand_id: "foo",
        },
      });
    });
  });

  describe("ad hoc", () => {
    it("should not throw if passed a valid request of ad hoc recipients", () => {
      doesNotThrow({
        message: {
          to: [
            {
              email: "drew@courier.com",
            },
            {
              email: "suhas@courier.com",
            },
            {
              email: "tejas@courier.com",
            },
          ],
          template: "XV6X2VWN2BM1B7NWAQ2H1Q9PTH6H",
        },
      });
    });

    it("should throw if passed an invalid request of ad hoc recipients", () => {
      doesThrow(
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
        "Invalid Request. 'message.to' must contain only one of the following properties: 'audience_id', 'list_id', 'list_pattern', or 'user_id'."
      );
    });
  });

  describe("routing", () => {
    it("should throw if message.routing.channels has an unknown channel", () => {
      doesThrow(
        {
          message: {
            to: { email: "example@example.com" },
            template: "XV6X2VWN2BM1B7NWAQ2H1Q9PTH6H",
            channels: {
              method: "all",
              channels: ["bloop"],
            },
          },
        },
        "Invalid Request. '\"method\"' is not a valid field of message.to.channels."
      );
    });

    it("should not throw if message.routing.channels only has known channels including providers", () => {
      doesNotThrow({
        message: {
          to: { email: "example@example.com" },
          template: "XV6X2VWN2BM1B7NWAQ2H1Q9PTH6H",
          routing: {
            method: "all",
            channels: ["email", "push", "sms", "slack", "mailjet"],
          },
        },
      });
    });
  });

  describe("channels", () => {
    it("should throw if message.channels is not an object", () => {
      doesThrow(
        {
          message: {
            to: { email: "test@test.com" },
            template: "XV6X2VWN2BM1B7NWAQ2H1Q9PTH6H",
            channels: "",
          },
        },
        "Invalid Request. Invalid definition for property 'channels'. 'channels' must be of type object."
      );
    });

    it("should not throw if message.channels is an object", () => {
      doesNotThrow({
        message: {
          to: { email: "test@test.com" },
          template: "XV6X2VWN2BM1B7NWAQ2H1Q9PTH6H",
          channels: { email: {} },
        },
      });
    });

    it("should throw if message.channels contains invalid keys", () => {
      doesThrow(
        {
          message: {
            to: { email: "test@test.com" },
            template: "XV6X2VWN2BM1B7NWAQ2H1Q9PTH6H",
            channels: { email: {}, foo: {} },
          },
        },
        "Invalid Request. '\"foo\"' is not a valid field of message.to.channels."
      );
    });
  });

  describe("to", () => {
    it("should throw if message.to.data is an array", () => {
      doesThrow(
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
              version: "2022-01-01",
              elements: [
                {
                  type: "meta",
                  title: "FOO",
                },
              ],
            },
          },
        },
        "Invalid Request. Invalid definition for property 'data'. 'data' must be of type object."
      );
    });

    it("should throw if message.to.data is an array", () => {
      doesThrow(
        {
          message: {
            to: [
              {
                email: "bar@courier.com",
              },
              {
                email: "test@gmail.com",
                data: [
                  {
                    name: "foo",
                  },
                ],
              },
            ],
            content: {
              version: "2022-01-01",
              elements: [
                {
                  type: "meta",
                  title: "FOO",
                },
              ],
            },
          },
        },
        "Invalid Request. Invalid definition for property 'data'. 'data' must be of type object."
      );
    });

    it("should throw if message.to is not defined", () => {
      doesThrow(
        {
          message: {
            template: "XV6X2VWN2BM1B7NWAQ2H1Q9PTH6H",
          },
        },
        "Invalid Request. The 'to' property is required."
      );
    });

    it("should throw if message.to is empty", () => {
      doesThrow(
        {
          message: {
            template: "XV6X2VWN2BM1B7NWAQ2H1Q9PTH6H",
            to: {},
          },
        },
        "Invalid Request. The 'to' property must not be empty."
      );
    });
  });

  describe("content", () => {
    it("should throw if message.content.body or message.content.elements is not defined", () => {
      doesThrow(
        {
          message: {
            to: { email: "test@test.com" },
            content: {},
            routing: {
              method: "all",
              channels: ["email", "push", "sms", "slack", "mailjet"],
            },
          },
        },
        "Invalid Request. 'content' must contain one of the following properties: 'title', 'body', or 'elements'"
      );
    });
  });

  describe("data", () => {
    it("should throw if message.data is an array", () => {
      doesThrow(
        {
          message: {
            to: [
              {
                email: "drew@courier.com",
              },
              {
                email: "suhas@courier.com",
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
              version: "2022-01-01",
              elements: [
                {
                  type: "meta",
                  title: "FOO",
                },
              ],
            },
          },
        },
        "Invalid Request. Invalid definition for property 'data'. 'data' must be of type object."
      );
    });

    it("should throw if message.data is not an object.", () => {
      doesThrow(
        {
          message: {
            to: { email: "test@test.com" },
            template: "foo",
            data: "",
          },
        },
        "Invalid Request. Invalid definition for property 'data'. 'data' must be of type object."
      );
    });

    it("should not throw if message.data is not defined.", () => {
      doesNotThrow({
        message: {
          to: { email: "test@email.com" },
          template: "foo",
        },
      });
    });
  });

  describe("metadata", () => {
    it("should throw if metadata contains an invalid key", () => {
      doesThrow(
        {
          message: {
            to: { email: "test@mail.com" },
            template: "foo",
            metadata: {
              foo: {
                bar: "baz",
              },
            },
          },
        },
        "Invalid Request. '\"foo\"' is not a valid field of message.metadata."
      );
    });

    it("should throw if metadata.event is not a string.", () => {
      doesThrow(
        {
          message: {
            to: { email: "test@mail.com" },
            template: "foo",
            metadata: {
              event: {
                test: "foo",
              },
            },
          },
        },
        "Invalid definition for property 'metadata.event'. 'event' must be of type string."
      );
    });

    it("should not throw if metadata.event is a string.", () => {
      doesNotThrow({
        message: {
          to: { email: "test@mail.com" },
          template: "foo",
          metadata: {
            event: "bar",
          },
        },
      });
    });

    it("should throw if metadata.trace_id is not a string.", () => {
      doesThrow(
        {
          message: {
            to: { email: "test@mail.com" },
            template: "foo",
            metadata: {
              trace_id: {
                harry: "potter",
              },
            },
          },
        },
        "Invalid definition for property 'metadata.trace_id'. 'trace_id' must be of type string."
      );
    });

    it("should not throw if metadata.trace_id is a string.", () => {
      doesNotThrow({
        message: {
          to: { email: "test@mail.com" },
          template: "foo",
          metadata: {
            trace_id: "Gryffindor-for-the-win",
          },
        },
      });
    });

    it("should throw if metadata.trace_id is a number.", () => {
      doesThrow(
        {
          message: {
            to: { email: "test@mail.com" },
            template: "foo",
            metadata: {
              trace_id: 123456789,
            },
          },
        },
        "Invalid definition for property 'metadata.trace_id'. 'trace_id' must be of type string."
      );
    });

    it("should throw if metadata.trace_id is greater than 36 characters.", () => {
      doesThrow(
        {
          message: {
            to: { email: "test@mail.com" },
            template: "foo",
            metadata: {
              trace_id: "harry potter".repeat(10),
            },
          },
        },
        "Invalid definition for property 'metadata.trace_id'. Trace ID cannot be longer than 36 characters."
      );
    });

    it("should not throw if metadata.tags has 9 items or less.", () => {
      doesNotThrow({
        message: {
          to: { email: "test@mail.com" },
          template: "foo",
          metadata: {
            tags: Array.from({ length: 9 }).map((i) => `tag-${i}`),
          },
        },
      });
    });

    it("should throw if metadata.tags has more than 9 items.", () => {
      doesThrow(
        {
          message: {
            to: { email: "test@mail.com" },
            template: "foo",
            metadata: {
              tags: Array.from({ length: 10 }).map((i) => `tag-${i}`),
            },
          },
        },
        "Invalid definition for property 'metadata.tags'. Cannot specify more than 9 tags."
      );
    });

    it("should throw if metadata.tags has an item longer than 30 characters.", () => {
      doesThrow(
        {
          message: {
            to: { email: "test@mail.com" },
            template: "foo",
            metadata: {
              tags: ["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
            },
          },
        },
        "Invalid definition for property 'metadata.tags'. Tags cannot be longer than 30 characters."
      );
    });

    it("should throw if metadata.utm is not an object.", () => {
      doesThrow(
        {
          message: {
            to: { email: "test@mail.com" },
            template: "foo",
            metadata: {
              utm: "baz",
            },
          },
        },
        "Invalid definition for property 'metadata.utm'. 'utm' must be of type object."
      );
    });

    it("should throw if metadata.utm has invalid keys.", () => {
      doesThrow(
        {
          message: {
            to: { email: "test@mail.com" },
            template: "foo",
            metadata: {
              utm: {
                bar: "baz",
              },
            },
          },
        },
        "Invalid Request. '\"bar\"' is not a valid field of metadata.utm."
      );
    });

    it("should not throw if metadata.utm has valid keys.", () => {
      doesNotThrow({
        message: {
          to: { email: "test@mail.com" },
          template: "foo",
          metadata: {
            utm: {
              source: "bar",
            },
          },
        },
      });
    });

    it("should throw if metadata.utm has valid keys with invalid types.", () => {
      doesThrow(
        {
          message: {
            to: { email: "test@mail.com" },
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
        "Invalid definition for property 'metadata.utm.source'. 'source' must be of type string."
      );
    });
  });

  describe("audience", () => {
    it("should throw if audience_id is mentioned but is falsy", () => {
      doesThrow(
        {
          message: {
            to: { audience_id: "" },
            template: "foo",
          },
        },
        "Invalid Request. The audience_id must be defined."
      );
    });

    it("should not throw if audience_id is mentioned defined", () => {
      doesNotThrow({
        message: {
          to: { audience_id: "my-fav-pigeons" },
          template: "foo",
        },
      });
    });

    it("should throw if audience_id is not a string", () => {
      doesThrow(
        {
          message: {
            to: { audience_id: { foo: "bar" } },
            template: "foo",
          },
        },
        "Invalid Request. Invalid definition for property 'audience_id'. 'audience_id' must be of type string."
      );
    });
  });

  describe("providers validation", () => {
    const validateWithProviders = (providers: any) => {
      const request = {
        message: {
          to: { email: "test@mail.com" },
          template: "foo",
          providers,
        },
      };

      validateV2RequestAjv(request);
    };

    it("should not throw given valid providers", () => {
      doesNotThrow(
        {
          apn: {
            if: "hello === 3",
            timeout: 350,
            override: {
              someArbitraryKey: "someArbitraryValue",
            },
          },
        },
        validateWithProviders
      );
    });

    it("should throw given invalid provider", () => {
      doesThrow(
        {
          foo: {
            if: "hello === 3",
            timeout: 350,
            override: {
              someArbitraryKey: "someArbitraryValue",
            },
          },
        },
        "Invalid Request. '\"foo\"' is not a valid field of message.to.providers.",
        validateWithProviders
      );
    });

    it("should throw given invalid provider field type", () => {
      doesThrow(
        {
          apn: {
            if: 4,
          },
        },
        "Invalid definition for property 'message.providers.apn.if'. 'if' must be of type string.",
        validateWithProviders
      );
    });
  });

  describe("timeout", () => {
    it("should throw if message.timeout is not a object.", () => {
      doesThrow(
        {
          message: {
            to: { email: "test@mail.com" },
            template: "foo",
            timeout: "this should not work",
          },
        },
        "Invalid definition for property 'message.timeout'. 'timeout' must be of type object."
      );
    });

    it("should throw if message.timeout is not a valid object.", () => {
      doesThrow(
        {
          message: {
            to: { email: "test@mail.com" },
            template: "foo",
            timeout: {
              message: "this does not work",
            },
          },
        },
        "Invalid definition for property 'timeout.message'. 'message' must be of type number."
      );
    });

    it("should throw if message.timeout.message is negative.", () => {
      doesThrow(
        {
          message: {
            to: { email: "test@mail.com" },
            template: "foo",
            timeout: {
              message: -1,
            },
          },
        },
        "Invalid definition for property 'timeout.message'. 'message' must be greater or equal to 0"
      );
    });

    it("should throw if message.timeout.message is outside the range of 72 hours.", () => {
      doesThrow(
        {
          message: {
            to: { email: "test@mail.com" },
            template: "foo",
            timeout: {
              message: 500000000,
            },
          },
        },
        "Invalid definition for property 'timeout.message'. 'message' must be less or equal to 259200000"
      );
    });
  });

  describe("override", () => {
    const message = (brand: any) => ({
      message: {
        to: { email: "test@mail.com" },
        template: "foo",
      },
    });

    it("does not throw given valid brand v2022-05-17 config", () => {
      doesNotThrow(
        message({
          version: "2022-05-17",
          colors: {
            primary: "#ff0000",
            secondary: "#00ff00",
          },
          logo: {
            href: "https://example.com",
            image: "https://example.com/logo.png",
          },
        })
      );
    });

    it("does not throw given valid brand v2020-06-19T18:51:36.083Z config", () => {
      doesNotThrow(
        message({
          settings: {
            colors: {
              primary: "#ff0000",
              secondary: "#00ff00",
            },
            email: {
              header: {
                logo: {
                  href: "https://example.com",
                  image: "https://example.com/logo.png",
                },
              },
            },
            snippets: {
              items: [
                {
                  format: "handlebars",
                  name: "idk",
                  value: "ikr",
                },
              ],
            },
          },
        })
      );
    });

    it("throws given a bad brand config", () => {
      doesNotThrow(
        message({
          clrs: {
            primary: "#ff0000",
            secondary: "#00ff00",
          },
          snippets: {
            foo: "bar",
            items: [{ name: "foo", format: "handlebars", value: "bar" }],
          },
        })
      );
    });
  });
});

function clearMocks() {
  CourierLogger.mockClear();
}

function doesNotThrow(payload, fn = validateV2RequestAjv) {
  expect(() => fn(payload)).not.toThrow();
}

function doesThrow(payload, message, fn = validateV2RequestAjv) {
  expect(() => fn(payload)).toThrow(message);
}
