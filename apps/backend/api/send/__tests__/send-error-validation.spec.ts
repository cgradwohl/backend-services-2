import * as sendModule from "~/api/send";
import { NotFound } from "~/lib/http-errors";
import BadRequestError from "~/lib/http-errors/bad-request";
import { ApiRequestContext } from "~/lib/lambda-response";

jest.mock("~/lib/idempotent-requests", () => ({
  get: jest.fn(),
}));

jest.mock("~/lib/brands", () => ({
  get: jest.fn().mockReturnValue(() => new NotFound()),
  getLatest: jest.fn().mockReturnValueOnce({
    id: "this-brand-exists",
    name: "this-brand-exists",
    published: 1231235,
  }),
}));

jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});

jest.mock("~/lib/get-environment-variable");

describe("tests for api v1 for invalid cases", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("should throw api error if event is missing", async () => {
    const response = await sendModule.handleSendRequest({
      context: {
        event: {
          body: {
            recipient: "me",
          },
        },
      } as unknown as ApiRequestContext,
      messageId: "1-616a628c-645660fe65ec70a74c9f1a7c",
    });
    expect(response.body).toMatchObject({
      message: "The 'event' parameter is required.",
      status: 400,
    });
    expect(response.status).toBe(400);
  });

  it("should throw api error if recipientId is missing", async () => {
    const response = await sendModule.handleSendRequest({
      context: {
        event: {
          body: {
            event: "PCD2NFHA624E10JGBZYYD7MJYGZ8",
          },
        },
      } as unknown as ApiRequestContext,
      messageId: "1-616a628c-645660fe65ec70a74c9f1a7c",
    });
    expect(response.body).toMatchObject({
      message: "The 'recipient' parameter is required.",
      status: 400,
    });
    expect(response.status).toBe(400);
  });

  it("should throw api error if profile is not valid json", async () => {
    try {
      const response = await sendModule.handleSendRequest({
        context: {
          event: {
            body: {
              event: "PCD2NFHA624E10JGBZYYD7MJYGZ8",
              recipient: "argo",
              profile: "",
            },
          },
        } as unknown as ApiRequestContext,
        messageId: "1-616a628c-645660fe65ec70a74c9f1a7c",
      });

      // we expect "handleSendRequest" to throw before the following assertion.
      expect(1).toBe(0);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestError);
    }
  });

  it("should throw api error if data is valid json", async () => {
    try {
      const response = await sendModule.handleSendRequest({
        context: {
          event: {
            body: {
              event: "PCD2NFHA624E10JGBZYYD7MJYGZ8",
              recipient: "argo",
              profile: '{"email":"suhas2u@gmail.com"}',
              data: ",",
            },
          },
        } as unknown as ApiRequestContext,
        messageId: "1-616a628c-645660fe65ec70a74c9f1a7c",
      });

      // we expect "handleSendRequest" to throw before the following assertion.
      expect(1).toBe(0);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestError);
    }
  });

  it("should throw 422 error when user provides brand that does not exists", async () => {
    const response = await sendModule.handleSendRequest({
      context: {
        tenantId: "1234213",
        scope: "published/",
        event: {
          body: {
            brand: "brand-that-does-not-exists",
            event: "PCD2NFHA624E10JGBZYYD7MJYGZ8",
            recipient: "argo",
            profile: '{"email":"suhas2u@gmail.com"}',
            data: { hello: "world" },
          },
        },
      } as unknown as ApiRequestContext,
      messageId: "1-616a628c-645660fe65ec70a74c9f1a7c",
    });
    expect(response.body).toMatchObject({
      message: "Invalid brand (brand-that-does-not-exists)",
      status: 422,
    });
    expect(response.status).toBe(422);
  });
});
