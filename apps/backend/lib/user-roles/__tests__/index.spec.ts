import { IRole } from "~/lib/access-control/types";
import { getItem, query, deleteItem, update } from "~/lib/dynamo";
import service from "../index";

jest.mock("~/lib/dynamo");

const mockGetItem = getItem as jest.Mock;
const mockDeleteItem = deleteItem as jest.Mock;
const mockQuery = query as jest.Mock;
const mockUpdate = update as jest.Mock;

const mockWorkspaceId = "mockWorkspaceId";

let userRoles: ReturnType<typeof service>;

const createTestRole = (role?: Partial<IRole>): IRole => {
  return {
    label: role?.label ?? "label",
    description: role?.description ?? "description",
    key: role?.key ?? "role",
    policies: role?.policies ?? [],
  };
};

const createMockDynamoItem = (role: IRole) => ({
  pk: mockWorkspaceId,
  sk: `role/${role.key}`,
  ...role,
});

beforeEach(() => {
  userRoles = service(mockWorkspaceId);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe("delete", () => {
  it("should attempt to delete item from dynamo", async () => {
    await userRoles.delete("id");
    expect(mockDeleteItem).toMatchSnapshot();
  });
});

describe("get", () => {
  it("should attempt to fetch the role from dynamo", async () => {
    await userRoles.get("custom-role");
    expect(mockGetItem).toMatchSnapshot();
  });

  describe("custom roles", () => {
    beforeEach(() => {
      const mockRole = createTestRole({ key: "custom-role" });
      mockGetItem.mockResolvedValue({
        Item: createMockDynamoItem(mockRole),
      });
    });

    it("should return a custom role when found", async () => {
      const role = await userRoles.get("custom-role");
      expect(role).toMatchSnapshot();
    });
  });

  describe("system roles", () => {
    beforeEach(() => {
      mockGetItem.mockResolvedValue({
        Item: undefined,
      });
    });

    it("should return role", async () => {
      const roleNames = [
        "ADMINISTRATOR",
        "ANALYST",
        "DESIGNER",
        "DEVELOPER",
        "MANAGER",
        "SUPPORT_SPECIALIST",
      ];
      for (const roleName of roleNames) {
        const role = await userRoles.get(roleName);
        expect(role).toMatchSnapshot();
      }
    });
  });
});

describe("list", () => {
  beforeEach(async () => {
    const mockItem = createMockDynamoItem(createTestRole());

    mockQuery.mockResolvedValue({
      Items: [mockItem],
    });
  });

  it("should query dynamo for list of items", async () => {
    await userRoles.list();
    expect(mockQuery).toMatchSnapshot();
  });

  it("should return list of items", async () => {
    const list = await userRoles.list();
    expect(list).toMatchSnapshot();
  });
});

describe("replace", () => {
  it("should attempt to replace item in dynamo", async () => {
    await userRoles.replace(createTestRole());
    expect(mockUpdate).toMatchSnapshot();
  });
});
