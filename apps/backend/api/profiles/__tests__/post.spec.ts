import { apiRequestContext } from "~/__tests__/lib/lambda-response.spec";
import { post } from "~/api/profiles/post";
import * as dynamoProfiles from "~/lib/dynamo/profiles";

jest.mock("~/lib/dynamo/profiles");
jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});

const dynamo = dynamoProfiles as any;

const EMPTY_PROFILE = { json: {} };
const EXISTING_PROFILE = { json: { name: "Courier" } };
const EXISTING_PROFILE_TWO = {
  json: JSON.stringify({ name: "Courier", email: "getting@replaced.com" }),
};
const NEW_PROFILE = '{"profile":{"email":"deliver@courier.com"}}';
const NEW_PROFILE_TWO =
  '{"profile":{"email":"deliver@courier.com","city":"SF"}}';

describe("when adding profiles", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("will return a new profile given an existing profile", async () => {
    const EXPECTED_PROFILE = '{"name":"Courier","email":"deliver@courier.com"}';

    dynamo.get.mockResolvedValue(EXISTING_PROFILE);

    await expect(
      post({
        ...apiRequestContext,
        event: { ...apiRequestContext.event, body: NEW_PROFILE },
      })
    ).resolves.toEqual({ status: "SUCCESS" });
    expect(dynamo.update.mock.calls.length).toBe(1);
    expect(dynamo.update.mock.calls[0][2]).toStrictEqual({
      json: EXPECTED_PROFILE,
    });
  });

  [null, EMPTY_PROFILE].forEach((testCase) => {
    it(`will return a new profile given ${testCase}`, async () => {
      const EXPECTED_PROFILE = '{"email":"deliver@courier.com"}';

      dynamo.get.mockResolvedValue(testCase);

      await expect(
        post({
          ...apiRequestContext,
          event: { ...apiRequestContext.event, body: NEW_PROFILE },
        })
      ).resolves.toEqual({ status: "SUCCESS" });
      expect(dynamo.update.mock.calls.length).toBe(1);
      expect(dynamo.update.mock.calls[0][2]).toStrictEqual({
        json: EXPECTED_PROFILE,
      });
    });
  });

  [null, ""].forEach((testCase) => {
    it(`will throw BadRequest error given ${testCase}`, async () => {
      await expect(
        post({
          ...apiRequestContext,
          event: { ...apiRequestContext.event, body: testCase },
        })
      ).rejects.toThrowError("No Body Provided");
      expect(dynamo.update.mock.calls.length).toBe(0);
    });
  });

  it(`will throw BadRequest error given an empty object`, async () => {
    await expect(
      post({
        ...apiRequestContext,
        event: { ...apiRequestContext.event, body: "{}" },
      })
    ).rejects.toThrowError("profile property is required");
    expect(dynamo.update.mock.calls.length).toBe(0);
  });

  it("will not allow additional keys", async () => {
    await expect(
      post({
        ...apiRequestContext,
        event: {
          ...apiRequestContext.event,
          body: JSON.stringify({ foo: "bar", profile: {} }),
        },
      })
    ).rejects.toThrowError("body contains extra keys");
    expect(dynamo.update.mock.calls.length).toBe(0);
  });

  it("will return a merged profile given an existing string profile and new profile data", async () => {
    const EXPECTED_PROFILE =
      '{"name":"Courier","email":"deliver@courier.com","city":"SF"}';

    dynamo.get.mockResolvedValue(EXISTING_PROFILE_TWO);

    await expect(
      post({
        ...apiRequestContext,
        event: { ...apiRequestContext.event, body: NEW_PROFILE_TWO },
      })
    ).resolves.toEqual({ status: "SUCCESS" });
    expect(dynamo.update.mock.calls.length).toBe(1);
    expect(dynamo.update.mock.calls[0][2]).toStrictEqual({
      json: EXPECTED_PROFILE,
    });
  });
});
