import { IProfileObject } from "~/lib/dynamo/profiles";
import getUserPreferences from "~/send/worker/commands/prepare/get-user-preferences";

jest.mock("~/preferences/services/dynamo-service", () => ({
  preferenceTemplateService: jest.fn().mockReturnValue({
    get: jest.fn().mockReturnValue({
      value: {
        status: "OPTED_IN",
      },
    }),
  }),
}));

describe("get user preference", () => {
  it("should handle user with no preferences", async () => {
    const mockSavedProfile = {
      id: "suhas_rd",
    };
    expect(
      await getUserPreferences(
        mockSavedProfile,
        "mock-tenant-id",
        undefined,
        undefined
      )
    ).toBeUndefined();
  });
  it("should handle user preferences set using preferences endpoint", async () => {
    const mockSavedProfile: Pick<IProfileObject, "preferences" | "id"> = {
      id: "suhas_rd",
      preferences: {
        notifications: {
          "mock-notification-api-key-id": {
            status: "OPTED_IN",
          },
        },
      },
    };
    const actualPreferences = await getUserPreferences(
      mockSavedProfile,
      "mock-tenant-id",
      undefined,
      undefined
    );
    const expectedPreferences = {
      categories: null,
      notifications: {
        "mock-notification-api-key-id": {
          status: "OPTED_IN",
        },
      },
    };
    expect(actualPreferences).toEqual(expectedPreferences);
  });
  it("should respect user preferences set using preference grouping", async () => {
    const mockSavedProfile: Pick<IProfileObject, "preferences" | "id"> = {
      id: "suhas_rd",
      preferences: {
        notifications: {
          "mock-notification-api-key-id": {
            status: "OPTED_OUT",
          },
        },
      },
    };
    const actualPreferences = await getUserPreferences(
      mockSavedProfile,
      "mock-tenant-id",
      undefined,
      "mock-preference-grouping-id",
      "mock-notification-api-key-id"
    );
    const expectedPreferences = {
      categories: null,
      notifications: {
        "mock-notification-api-key-id": {
          status: "OPTED_IN",
        },
      },
    };
    expect(actualPreferences).toEqual(expectedPreferences);
  });
  it("should handle user preferences set using preference at request time", async () => {
    const mockSavedProfile: Pick<IProfileObject, "preferences" | "id"> = {
      id: "suhas_rd",
      preferences: {
        notifications: {
          "mock-notification-api-key-id": {
            status: "OPTED_OUT",
          },
        },
      },
    };
    const actualPreferences = await getUserPreferences(
      mockSavedProfile,
      "mock-tenant-id",
      {
        notifications: {
          "mock-notification-api-key-id": {
            status: "OPTED_IN",
          },
        },
      },
      "mock-preference-grouping-id",
      "mock-notification-api-key-id"
    );
    const expectedPreferences = {
      categories: null,
      notifications: {
        "mock-notification-api-key-id": {
          status: "OPTED_IN",
        },
      },
    };
    expect(actualPreferences).toEqual(expectedPreferences);
  });
});
