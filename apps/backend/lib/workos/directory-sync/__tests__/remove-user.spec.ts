import {
  getInvitationByEmail,
  remove as removeInvitation,
} from "~/lib/invitation-service/invite-user-object";
import {
  getCognitoUserByEmail,
  softRemoveFromUserPool,
} from "~/lib/workos/utils";
import { removeUser } from "../remove-user";

jest.mock("~/lib/invitation-service/invite-user-object", () => ({
  getInvitationByEmail: jest.fn(),
  remove: jest.fn(),
}));
jest.mock("~/lib/workos/utils", () => ({
  ...jest.requireActual("~/lib/workos/utils"),
  softRemoveFromUserPool: jest.fn(),
  getCognitoUserByEmail: jest.fn(() => Promise.resolve({ id: "me" })),
}));

const mockGetCognitoUserByEmail = getCognitoUserByEmail as jest.Mock;
const mockSoftRemoveFromUserPool = softRemoveFromUserPool as jest.Mock;
const mockGetInvitationByEmail = getInvitationByEmail as jest.Mock;
const mockRemoveInvitation = removeInvitation as jest.Mock;

describe("directory sync - remove user", () => {
  afterEach(jest.clearAllMocks);

  const userData: any = {
    directory_id: "my_dir",
    idp_id: "my_idp",
    emails: [{ primary: true, type: "work", value: "me@me.com" }],
    custom_attributes: { role: "ADMINISTRATOR" },
    state: "active",
  };

  it("removes an existing user", async () => {
    await removeUser(userData, "123");
    expect(mockSoftRemoveFromUserPool).toHaveBeenCalledWith("me", "123");
  });

  it("removes an invited user", async () => {
    mockGetCognitoUserByEmail.mockResolvedValueOnce(undefined);
    mockGetInvitationByEmail.mockResolvedValueOnce({ json: { code: "1234" } });
    await removeUser(userData, "123");
    expect(mockRemoveInvitation).toHaveBeenCalledWith({
      code: "1234",
      tenantId: "123",
      email: "me@me.com",
      userId: "",
    });
  });
});
