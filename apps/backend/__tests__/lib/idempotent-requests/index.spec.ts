import {
  getItem as mockGetItem,
  put as mockPut,
  update as mockUpdate,
} from "~/lib/dynamo";
import { get, put, update } from "~/lib/idempotent-requests/index";

jest.mock("~/lib/dynamo", () => {
  const getItem = jest
    .fn()
    .mockResolvedValueOnce({
      Item: {},
    })
    .mockResolvedValueOnce({
      Item: {},
    });

  const put = jest.fn();
  const update = jest.fn();

  return {
    getItem,
    put,
    update,
  };
});

describe("creating and retrieving idempotent requests", () => {
  const OLD_ENV = { ...process.env };

  afterAll(() => {
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    process.env.IDEMPOTENT_REQUESTS_V2_TABLE_NAME =
      "jest-mock-table-name-idempotent-requests-v2";

    jest.resetModules();
  });

  it(`will lookup v2 table`, async () => {
    await get("t", "i");
    expect((mockGetItem as jest.Mock).mock.calls.length).toBe(1);
    expect((mockGetItem as jest.Mock).mock.calls[0][0].Key.pk).toBe("t/i");
  });

  it(`will save to v2 table`, async () => {
    await put("ce79b74a-caad-451c-9bd3-0fd95a2d4ea8", "i", {
      body: "foo",
      statusCode: 200,
    });

    expect((mockPut as jest.Mock).mock.calls.length).toBe(1);
    expect((mockPut as jest.Mock).mock.calls[0][0].Item.pk).toBe(
      "ce79b74a-caad-451c-9bd3-0fd95a2d4ea8/i"
    );
    expect((mockPut as jest.Mock).mock.calls[0][0].TableName).toBe(
      "jest-mock-table-name-idempotent-requests-v2"
    );
  });

  it(`will update table`, async () => {
    await update("t", "i", {
      body: "foo",
      statusCode: 200,
    });
    expect((mockUpdate as jest.Mock).mock.calls.length).toBe(1);
    expect((mockUpdate as jest.Mock).mock.calls[0][0].TableName).toBe(
      "jest-mock-table-name-idempotent-requests-v2"
    );
    expect((mockUpdate as jest.Mock).mock.calls[0][0].Key.pk).toBe("t/i");
  });
});
