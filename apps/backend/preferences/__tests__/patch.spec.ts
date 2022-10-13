import { API_GATEWAY_PROXY_EVENT } from "~/__tests__/lib/lambda-response.spec";
import * as dynamoProfiles from "~/lib/dynamo/profiles";
import { patch } from "~/preferences/api/patch";

jest.mock("~/lib/dynamo/profiles");
jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});

const dynamo = dynamoProfiles as any;

describe("when patching profiles", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should allow adding preferences", async () => {
    dynamo.get.mockResolvedValue({
      preferences: {
        categories: {},
        notifications: {},
      },
    });

    const body = JSON.stringify({
      patch: [
        {
          op: "add",
          path: "/categories/8YA052Y5VV4EMQP2C4KW76WF3BC3",
          value: {
            status: "OPTED_IN",
          },
        },
      ],
    });

    await expect(
      patch({ event: { ...API_GATEWAY_PROXY_EVENT, body } })
    ).resolves.toEqual({ status: "SUCCESS" });

    const expected = {
      preferences: {
        categories: {
          "4794028b-2ef6-4752-b098-49f0371e35b0": {
            status: "OPTED_IN",
          },
        },
        notifications: {},
      },
    };
    const actual = dynamo.update.mock.calls[0][2];
    expect(dynamo.update.mock.calls.length).toBe(1);
    expect(actual).toEqual(expected);
  });

  it("should allow removing preferences", async () => {
    dynamo.get.mockResolvedValue({
      preferences: {
        categories: {
          "4794028b-2ef6-4752-b098-49f0371e35b0": {
            status: "OPTED_IN",
          },
        },
        notifications: {},
      },
    });

    const body = JSON.stringify({
      patch: [
        {
          op: "remove",
          path: "/categories/8YA052Y5VV4EMQP2C4KW76WF3BC3",
          value: {
            status: "OPTED_IN",
          },
        },
      ],
    });

    await expect(
      patch({ event: { ...API_GATEWAY_PROXY_EVENT, body } })
    ).resolves.toEqual({ status: "SUCCESS" });

    const expected = {
      preferences: {
        categories: {},
        notifications: {},
      },
    };
    const actual = dynamo.update.mock.calls[0][2];
    expect(dynamo.update.mock.calls.length).toBe(1);
    expect(actual).toEqual(expected);
  });

  it("should allow replacing existing notification status", async () => {
    dynamo.get.mockResolvedValue({
      preferences: {
        categories: {},
        notifications: {
          "03b76ca7-99c6-4af3-84cb-c3c0f02596f4": {
            status: "OPTED_OUT",
          },
          "4794028b-2ef6-4752-b098-49f0371e35b0": {
            status: "OPTED_OUT",
          },
          "8802cbb3-52e1-4b69-8e6e-01360ec53ca5": {
            status: "OPTED_OUT",
          },
        },
      },
    });

    const expected = {
      preferences: {
        categories: {},
        notifications: {
          "03b76ca7-99c6-4af3-84cb-c3c0f02596f4": {
            status: "OPTED_OUT",
          },
          "4794028b-2ef6-4752-b098-49f0371e35b0": {
            status: "OPTED_IN",
          },
          "8802cbb3-52e1-4b69-8e6e-01360ec53ca5": {
            status: "OPTED_OUT",
          },
        },
      },
    };

    const body = JSON.stringify({
      patch: [
        {
          op: "replace",
          path: "/notifications/8YA052Y5VV4EMQP2C4KW76WF3BC3/status",
          value: "OPTED_IN",
        },
      ],
    });
    await expect(
      patch({ event: { ...API_GATEWAY_PROXY_EVENT, body } })
    ).resolves.toEqual({ status: "SUCCESS" });
    const actual = dynamo.update.mock.calls[0][2];
    expect(dynamo.update.mock.calls.length).toBe(1);
    expect(actual).toEqual(expected);
  });
});
