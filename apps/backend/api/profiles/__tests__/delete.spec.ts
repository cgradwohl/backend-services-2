import { apiRequestContext } from "~/__tests__/lib/lambda-response.spec";
import { deleteProfile } from "~/api/profiles/delete";
import * as dynamoProfiles from "~/lib/dynamo/profiles";

jest.mock("~/lib/dynamo/profiles");

jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});

const dynamo = dynamoProfiles as any;

describe("when deleting profiles", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return no error if deleting a valid profile", async () => {
    const dynamoDeleteProfileSpy = jest.spyOn(dynamo, "deleteProfile");
    dynamo.deleteProfile.mockResolvedValue("");
    await expect(deleteProfile(apiRequestContext)).resolves.toEqual({
      status: "SUCCESS",
    });
    expect(dynamoDeleteProfileSpy.mock.calls.length).toBe(1);
    const [[tenantId, profileId]] = dynamoDeleteProfileSpy.mock.calls;
    expect(tenantId).toBe("a-tenantId");
    expect(profileId).toBe("id");
  });

  it("should return an error if deleting profile results in failure", async () => {
    const mockErrorResponse = new Error("I do not want to delete you");
    dynamo.deleteProfile.mockRejectedValue(mockErrorResponse);
    await expect(deleteProfile(apiRequestContext)).rejects.toEqual(
      mockErrorResponse
    );
  });
});
