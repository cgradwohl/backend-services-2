import { syncUser } from "~/lib/workos/directory-sync";
import {
  handleDSyncUserCreated,
  handleDSyncUserDeleted,
  handleDSyncUserUpdated,
} from "~/lib/workos/webhook-handlers";

jest.mock("~/lib/workos/directory-sync");

const mockSyncUser = syncUser as jest.Mock;

describe("workos webhook handlers", () => {
  afterEach(jest.clearAllMocks);

  describe("dsync user created handler", () => {
    it("should create a user", async () => {
      await handleDSyncUserCreated(
        {
          emails: [{ primary: true, type: "work", value: "me@example.com" }],
          custom_attributes: { role: "ADMINISTRATOR" },
        } as any,
        5
      );
      expect(mockSyncUser).toHaveBeenCalled();
    });
  });

  describe("dsync user deleted handler", () => {
    it("should delete a user", async () => {
      await handleDSyncUserDeleted(
        {
          emails: [{ primary: true, type: "work", value: "me@example.com" }],
          custom_attributes: { role: "ADMINISTRATOR" },
        } as any,
        Date.now()
      );
      expect(mockSyncUser).toHaveBeenCalled();
    });
  });

  describe("dsync user updated handler", () => {
    it("should sync a user", async () => {
      await handleDSyncUserUpdated(
        {
          state: "suspended",
          emails: [{ primary: true, type: "work", value: "me@example.com" }],
          custom_attributes: { role: "ADMINISTRATOR" },
        } as any,
        5
      );
      expect(mockSyncUser).toHaveBeenCalled();
    });
  });
});
