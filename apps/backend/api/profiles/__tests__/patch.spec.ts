import { patch } from "~/api/profiles/patch";
import * as dynamoProfiles from "~/lib/dynamo/profiles";

import { apiRequestContext } from "~/__tests__/lib/lambda-response.spec";

jest.mock("~/lib/dynamo/profiles");
jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});

const dynamo = dynamoProfiles as any;

const EXISTING_PROFILE = { json: { profile: { name: "Courier" } } };

describe("when patching profiles", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("will apply patch given at least one op", async () => {
    const body = JSON.stringify({
      patch: [{ op: "add", path: "/email", value: "deliver@courier.com" }],
    });
    dynamo.get.mockResolvedValue(EXISTING_PROFILE);

    await expect(
      patch({
        ...apiRequestContext,
        ...{ event: { ...apiRequestContext.event, body } },
      })
    ).resolves.toEqual({ status: "SUCCESS" });
    expect(dynamo.update.mock.calls.length).toBe(1);
  });

  ['{"patch":[]}'].forEach((testCase) => {
    it(`will not apply patch given ${testCase}`, async () => {
      dynamo.get.mockResolvedValue(EXISTING_PROFILE);

      await expect(
        patch({
          ...apiRequestContext,
          event: { ...apiRequestContext.event, body: testCase },
        })
      ).resolves.toEqual({ status: "SUCCESS" });
      expect(dynamo.update.mock.calls.length).toBe(0);
    });
  });

  [null, ""].forEach((testCase) => {
    it(`will throw BadRequest error given ${testCase}`, async () => {
      dynamo.get.mockResolvedValue(EXISTING_PROFILE);

      await expect(
        patch({
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
      patch({
        ...apiRequestContext,
        event: { ...apiRequestContext.event, body: "{}" },
      })
    ).rejects.toThrowError("patch property is required");
    expect(dynamo.update.mock.calls.length).toBe(0);
  });

  it("will not allow additional keys", async () => {
    dynamo.get.mockResolvedValue(EXISTING_PROFILE);
    await expect(
      patch({
        ...apiRequestContext,
        event: {
          ...apiRequestContext.event,
          body: JSON.stringify({ foo: "bar", patch: [] }),
        },
      })
    ).rejects.toThrowError("body contains extra keys");
    expect(dynamo.update.mock.calls.length).toBe(0);
  });
});
