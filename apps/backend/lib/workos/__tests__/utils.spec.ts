import { UserNotFound } from "~/lib/cognito";
import {
  getCognitoUserByEmail,
  getEmailFromWorkOSUserData,
} from "~/lib/workos/utils";

jest.mock("~/lib/cognito", () => ({
  ...jest.requireActual("~/lib/cognito"),
  getSsoUserByEmail: () => mockCognitoGetUserByEmail(),
}));

const mockCognitoGetUserByEmail = jest.fn(() => Promise.resolve({ id: "me" }));

describe("workos utility functions", () => {
  afterEach(jest.clearAllMocks);
  describe("getEmailFromWorkOSUserData", () => {
    it("extracts primary email from workos user data", () => {
      expect(
        getEmailFromWorkOSUserData({
          emails: [
            { primary: false, type: "work", value: "bleh" },
            { primary: true, type: "work", value: "me@example.com" },
          ],
        } as any)
      ).toEqual("me@example.com");
    });
  });

  describe("getCognitoUserByEmail", () => {
    it("gets a cognito user by email", async () => {
      const result = await getCognitoUserByEmail("me@me.com");
      expect(result).toEqual({ id: "me" });
    });

    it("returns undefined when cognitoGetUserByEmail throws UserNotFound", async () => {
      mockCognitoGetUserByEmail.mockImplementationOnce(() => {
        throw new UserNotFound("");
      });
      expect(await getCognitoUserByEmail("")).toBeUndefined();
    });
  });
});
