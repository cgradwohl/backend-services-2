import { getItem, put } from "~/lib/dynamo";
import {
  getDirectorySyncTenantMap,
  putDirectorySyncTenantMap,
} from "~/lib/workos/directory-sync/directory-sync-table";

jest.mock("~/lib/dynamo", () => ({
  ...jest.requireActual("~/lib/dynamo"),
  getItem: jest.fn(),
  put: jest.fn(),
}));

const mockGetItem = getItem as jest.Mock;
const mockPut = put as jest.Mock;

describe("dynamo directory sync service", () => {
  const OLD_ENV = { ...process.env };

  beforeEach(() => {
    process.env = {
      ...OLD_ENV,
      DIRECTORY_SYNC_TABLE_NAME: "DIR_SYNC_TABLE_NAME",
    };
    jest.resetAllMocks();
    jest.resetModules();
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe("directory sync tenant map", () => {
    it("gets a tenant map", () => {
      const [directoryId, tenantId] = ["my-directory-id", "123"];
      mockGetItem.mockResolvedValue({ Item: { directoryId, tenantId } });

      expect(getDirectorySyncTenantMap(directoryId)).resolves.toMatchObject({
        directoryId,
        tenantId,
      });
      expect(mockGetItem).toHaveBeenCalledWith({
        Key: { pk: `${directoryId}/tenant` },
        TableName: process.env.DIRECTORY_SYNC_TABLE_NAME,
      });
    });

    it("puts a tenant map", async () => {
      const [directoryId, tenantId] = ["my-directory-id", "123"];
      await putDirectorySyncTenantMap(directoryId, tenantId);
      expect(mockPut).toHaveBeenCalledTimes(1);
      expect(mockPut).toHaveBeenCalledWith({
        Item: { pk: `${directoryId}/tenant`, tenantId },
        TableName: process.env.DIRECTORY_SYNC_TABLE_NAME,
      });
    });
  });
});
