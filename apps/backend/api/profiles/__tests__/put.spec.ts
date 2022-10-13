import { put } from "~/api/profiles/put";
import * as dynamoProfiles from "~/lib/dynamo/profiles";

import { apiRequestContext } from "~/__tests__/lib/lambda-response.spec";

jest.mock("~/lib/dynamo/profiles");
jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});

const dynamo = dynamoProfiles as any;

const EXISTING_PROFILE = { json: { profile: { name: "Courier" } } };

describe("when updating profiles", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("will return a new profile", async () => {
    const NEW_PROFILE = '{"profile":{"email":"deliver@courier.com"}}';

    dynamo.get.mockResolvedValue(EXISTING_PROFILE);

    await expect(
      put({
        ...apiRequestContext,
        event: { ...apiRequestContext.event, body: NEW_PROFILE },
      })
    ).resolves.toEqual({ status: "SUCCESS" });
    expect(dynamo.update.mock.calls.length).toBe(1);
    expect(dynamo.update.mock.calls[0][2]).toStrictEqual({
      json: '{"email":"deliver@courier.com"}',
    });
  });

  ['{"profile":{}}'].forEach((testCase) => {
    it(`will return an empty profile given an ${testCase}`, async () => {
      dynamo.get.mockResolvedValue(EXISTING_PROFILE);

      await expect(
        put({
          ...apiRequestContext,
          event: { ...apiRequestContext.event, body: testCase },
        })
      ).resolves.toEqual({ status: "SUCCESS" });
      expect(dynamo.update.mock.calls.length).toBe(1);
      expect(dynamo.update.mock.calls[0][2]).toStrictEqual({
        json: "{}",
      });
    });
  });

  [null, ""].forEach((testCase) => {
    it(`will throw BadRequest error given ${testCase}`, async () => {
      dynamo.get.mockResolvedValue(EXISTING_PROFILE);

      await expect(
        put({
          ...apiRequestContext,
          event: { ...apiRequestContext.event, body: testCase },
        })
      ).rejects.toThrowError("No Body Provided");
      expect(dynamo.update.mock.calls.length).toBe(0);
    });
  });

  it(`will throw BadRequest error given an empty object`, async () => {
    dynamo.get.mockResolvedValue(EXISTING_PROFILE);

    await expect(
      put({
        ...apiRequestContext,
        event: { ...apiRequestContext.event, body: "{}" },
      })
    ).rejects.toThrowError("profile property is required");
    expect(dynamo.update.mock.calls.length).toBe(0);
  });

  it("will not allow additional keys", async () => {
    dynamo.get.mockResolvedValue(EXISTING_PROFILE);
    await expect(
      put({
        ...apiRequestContext,
        event: {
          ...apiRequestContext.event,
          body: JSON.stringify({ foo: "bar", profile: {} }),
        },
      })
    ).rejects.toThrowError("body contains extra keys");
    expect(dynamo.update.mock.calls.length).toBe(0);
  });
});
