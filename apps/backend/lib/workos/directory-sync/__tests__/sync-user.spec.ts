import inviteUser from "~/lib/invitation-service/invite-user";
import { get as getTenant } from "~/lib/tenant-service";
import { syncUser } from "~/lib/workos/directory-sync";
import {
  getInvitationByEmail,
  remove as removeInvitation,
} from "~/lib/invitation-service/invite-user-object";
import {
  getDirectorySyncTenantMap,
  putDirectorySyncUser,
  getDirectorySyncUser,
} from "../directory-sync-table";
import { validateOrigin } from "~/lib/get-cors-origin";
import { setRole } from "~/lib/tenant-access-rights-service";
import { getIsUserActive } from "~/lib/workos/utils";
import { removeUser } from "../remove-user";

jest.mock("~/lib/invitation-service/invite-user", () => jest.fn());
jest.mock("~/lib/users", () => ({ deleteUser: jest.fn() }));
jest.mock("~/lib/invitation-service/invite-user-object", () => ({
  getInvitationByEmail: jest.fn(),
  remove: jest.fn(),
}));
jest.mock("~/lib/tenant-service", () => ({
  get: jest.fn(),
}));
jest.mock("~/lib/tenant-access-rights-service", () => ({
  get: jest.fn(),
  setRole: jest.fn(),
}));
jest.mock("../directory-sync-table");
jest.mock("../remove-user");
jest.mock("~/lib/workos/utils", () => ({
  ...jest.requireActual("~/lib/workos/utils"),
  getIsUserActive: jest.fn(() => true),
  getCognitoUserByEmail: jest.fn(() => Promise.resolve({ id: "me" })),
}));

const mockInviteUser = inviteUser as jest.Mock;
const mockGetTenant = getTenant as jest.Mock;
const mockGetInvitationByEmail = getInvitationByEmail as jest.Mock;
const mockRemoveInvitation = removeInvitation as jest.Mock;
const mockGetDirectorySyncTenantMap = getDirectorySyncTenantMap as jest.Mock;
const mockPutDirectorySyncUser = putDirectorySyncUser as jest.Mock;
const mockRemoveUser = removeUser as jest.Mock;
const mockSetRole = setRole as jest.Mock;
const mockGetIsUserActive = getIsUserActive as jest.Mock;
const mockGetDirectorySyncUser = getDirectorySyncUser as jest.Mock;

describe("directory sync - sync user", () => {
  afterEach(jest.clearAllMocks);

  const tenantId = "123";
  const email = "me@example.com";
  const tenant = { owner: "me", tenantId };
  const tenantMap = { tenantId };
  const timestamp = Date.now();
  const userData: any = {
    directory_id: "my_dir",
    idp_id: "my_idp",
    emails: [{ primary: true, type: "work", value: email }],
    custom_attributes: { role: "ADMINISTRATOR" },
    state: "active",
  };
  const directorySyncUser = {
    directoryId: userData.directory_id,
    idpUserId: userData.idp_id,
    state: userData.state,
    role: userData.custom_attributes.role,
    tenantId,
    updated: timestamp,
  };

  it("sends an invite for a newly added user", async () => {
    mockGetDirectorySyncTenantMap.mockResolvedValueOnce(tenantMap);
    mockGetTenant.mockResolvedValueOnce(tenant);
    mockGetIsUserActive.mockResolvedValueOnce(false);

    await syncUser(userData, timestamp);
    expect(mockInviteUser).toHaveBeenCalledWith({
      email,
      tenant,
      userId: tenant.owner,
      origin: validateOrigin({ origin: "https://app.courier.com" }),
      role: "ADMINISTRATOR",
    });
    expect(mockPutDirectorySyncUser).toHaveBeenCalledWith(directorySyncUser);
  });

  it("it re-sends invite when inactive user is updated", async () => {
    mockGetDirectorySyncTenantMap.mockResolvedValueOnce(tenantMap);
    mockGetInvitationByEmail.mockResolvedValueOnce({ json: { code: "123" } });
    mockGetTenant.mockResolvedValueOnce(tenant);
    mockGetIsUserActive.mockResolvedValueOnce(false);

    await syncUser(userData, timestamp);
    expect(mockRemoveInvitation).toHaveBeenCalledWith({
      email,
      tenantId,
      userId: "",
      code: "123",
    });
    expect(mockInviteUser).toHaveBeenCalledWith({
      email,
      tenant,
      userId: tenant.owner,
      origin: validateOrigin({ origin: "https://app.courier.com" }),
      role: "ADMINISTRATOR",
    });
    expect(mockPutDirectorySyncUser).toHaveBeenCalledWith(directorySyncUser);
  });

  it("it doesn't re-send invite when inactive user is updated but no attributes changed", async () => {
    mockGetDirectorySyncTenantMap.mockResolvedValueOnce(tenantMap);
    mockGetInvitationByEmail.mockResolvedValueOnce({ json: { code: "123" } });
    mockGetTenant.mockResolvedValueOnce(tenant);
    mockGetIsUserActive.mockResolvedValueOnce(false);
    mockGetDirectorySyncUser.mockResolvedValueOnce(directorySyncUser);

    await syncUser(userData, timestamp);
    expect(mockRemoveInvitation).not.toHaveBeenCalled();
    expect(mockInviteUser).not.toHaveBeenCalled();
    expect(mockPutDirectorySyncUser).toHaveBeenCalledWith(directorySyncUser);
  });

  it("updates an existing user, doesn't send an invite", async () => {
    mockGetDirectorySyncTenantMap.mockResolvedValueOnce(tenantMap);
    mockGetTenant.mockResolvedValueOnce(tenant);
    mockGetIsUserActive.mockResolvedValueOnce(true);

    await syncUser(userData, timestamp);
    expect(mockInviteUser).not.toHaveBeenCalled();
    expect(mockSetRole).toHaveBeenCalledWith(
      tenantId,
      "me",
      "ADMINISTRATOR",
      undefined
    );
    expect(mockPutDirectorySyncUser).toHaveBeenCalledWith(directorySyncUser);
  });

  it("removes an existing user", async () => {
    mockGetDirectorySyncTenantMap.mockResolvedValueOnce(tenantMap);
    mockGetTenant.mockResolvedValueOnce(tenant);
    mockGetIsUserActive.mockResolvedValueOnce(true);
    const suspendedUserData = { ...userData, state: "suspended" };

    await syncUser(suspendedUserData, timestamp);
    expect(mockRemoveUser).toHaveBeenCalledWith(suspendedUserData, tenantId);
    expect(mockPutDirectorySyncUser).toHaveBeenCalledWith({
      ...directorySyncUser,
      state: "suspended",
    });
  });

  it("skips older events", async () => {
    mockGetDirectorySyncTenantMap.mockResolvedValueOnce(tenantMap);
    mockGetTenant.mockResolvedValueOnce(tenant);
    mockGetIsUserActive.mockResolvedValueOnce(true);
    mockGetDirectorySyncUser.mockResolvedValueOnce({ updated: timestamp });
    const olderTimestamp = timestamp - 10000;

    await syncUser(userData, olderTimestamp);
    expect(mockInviteUser).not.toHaveBeenCalled();
    expect(mockPutDirectorySyncUser).not.toHaveBeenCalled();
  });
});
