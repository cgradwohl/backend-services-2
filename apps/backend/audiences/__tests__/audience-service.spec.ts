import { AudienceService } from "~/audiences/services";

const fakeAudienceId = "58AP6hApBghbbtMsne_lh";

const putMockFn = jest.fn().mockRejectedValueOnce(Promise.resolve());
const updateMockFn = jest.fn().mockReturnValue(
  Promise.resolve({
    Attributes: {
      version: 2,
      updatedAt: "2022-04-03T00:00:00.000Z",
      audienceId: fakeAudienceId,
      createdAt: "2022-03-07T20:50:20.084Z",
      description: "test",
      pk: `a/workspaceId/${fakeAudienceId}`,
      name: "Test audience",
    },
  })
);

jest.mock("~/audiences/lib/doc-client", () => ({
  getDocClient: () => ({
    put: (...params) => ({
      promise: () => putMockFn(...params),
    }),
    update: (...params) => ({
      promise: () => updateMockFn(...params),
    }),
  }),
}));

jest.mock("~/lib/get-hash-from-range", () => ({
  getHashFromRange: jest.fn().mockImplementation(() => "fake-shard-id"),
}));

jest.mock("nanoid", () => {
  return { nanoid: () => fakeAudienceId };
});

jest.mock("~/lib/get-environment-variable", () => {
  return {
    __esModule: true,
    default: jest.fn().mockReturnValue("test-audiences-table"),
  };
});

describe("AudienceService", () => {
  let service: AudienceService;
  const globalDate = Date;

  beforeAll(() => {
    service = new AudienceService("workspaceId");
    Date.now = jest.fn(() => new Date(Date.UTC(2022, 3, 3)).valueOf());
    process.env.AUDIENCES_TABLE_NAME = "test-audiences-table";
  });

  afterAll(() => {
    global.Date = globalDate;
    jest.resetAllMocks();
  });

  it("should create an audience", async () => {
    await service.updateAudience({
      id: fakeAudienceId,
      description: "test",
      name: "Test audience",
      filter: {
        operator: "AND",
        path: "profile.locale",
        value: "en-US",
      },
    });

    expect(updateMockFn).toHaveBeenCalledWith({
      TableName: "test-audiences-table",
      Key: {
        pk: `a/workspaceId/${fakeAudienceId}`,
      },
      UpdateExpression:
        "SET #audienceId = :audienceId, #createdAt = if_not_exists(#createdAt, :createdAt), #description = :description, #filter = :filter, #gsi1pk = if_not_exists(#gsi1pk, :gsi1pk), #name = :name, #updatedAt = :updatedAt, #version = if_not_exists(#version, :start) + :increment, #workspaceId = :workspaceId",
      ExpressionAttributeNames: {
        "#audienceId": "audienceId",
        "#createdAt": "createdAt",
        "#description": "description",
        "#filter": "filter",
        "#gsi1pk": "gsi1pk",
        "#name": "name",
        "#updatedAt": "updatedAt",
        "#version": "version",
        "#workspaceId": "workspaceId",
      },
      ExpressionAttributeValues: {
        ":audienceId": fakeAudienceId,
        ":createdAt": "2022-04-03T00:00:00.000Z",
        ":description": "test",
        ":filter": {
          operator: "AND",
          path: "profile.locale",
          value: "en-US",
        },
        ":gsi1pk": "a/workspaceId/fake-shard-id",
        ":name": "Test audience",
        ":updatedAt": "2022-04-03T00:00:00.000Z",
        ":increment": 1,
        ":start": 1,
        ":workspaceId": "workspaceId",
      },
      ReturnValues: "ALL_NEW",
    });
  });
});
