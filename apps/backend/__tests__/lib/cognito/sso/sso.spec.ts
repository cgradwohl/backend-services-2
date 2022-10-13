import {
  isSsoUser,
  getSignInProvider,
  isGoogleSsoUser,
  isCustomSsoUser,
  getSignInProviderFromDomainOfEmail,
} from "~/lib/cognito/sso";

describe("sso lib", () => {
  describe("isSsoUser", () => {
    it("should return true for a google sso user", () => {
      expect(isSsoUser("Google_21903i12-12312")).toEqual(true);
    });

    it("should return true for a github sso user", () => {
      expect(isSsoUser("Github_21903i12-12312")).toEqual(true);
    });

    it("should return true for a custom sso user", () => {
      expect(isSsoUser("OktaYoungwerth_21903i12-12312")).toEqual(true);
    });
  });

  describe("getSignInProvider", () => {
    it("should return email for a standard user", () => {
      expect(getSignInProvider("a7635fe4-b8ce-4d28-847d-0dee407a7634")).toEqual(
        "email"
      );
    });

    it("should return github for a github sso user", () => {
      expect(getSignInProvider("Github_21903i12-12312")).toEqual("github");
    });

    it("should return google for a google sso user", () => {
      expect(getSignInProvider("Google_21903i12-12312")).toEqual("google");
    });

    it("should return custom:<providerName> for a custom sso user", () => {
      expect(getSignInProvider("OktaYoungwerth_12312")).toEqual(
        "custom:OktaYoungwerth"
      );
    });
  });

  describe("getSignInProviderFromDomainOfEmail", () => {
    it("should return correct sign in provider", () => {
      expect(
        getSignInProviderFromDomainOfEmail("drew@drew-dev.com")
      ).resolves.toEqual("custom:OktaDrewDev");
    });
  });

  describe("isGoogleSsoUser", () => {
    it("should return true for google sso user", () => {
      expect(isGoogleSsoUser("Google_21903i12")).toEqual(true);
    });

    it("should return false for a non google sso user", () => {
      expect(isGoogleSsoUser("a7635fe4-b8ce-4d28-847d-0dee407a7634")).toEqual(
        false
      );
    });
  });

  describe("isCustomSsoUser", () => {
    it("should return true for a custom sso user", () => {
      expect(isCustomSsoUser("OktaYoungwerth_21903i12")).toEqual(true);
    });

    it("should return false for a non custom sso user", () => {
      expect(isCustomSsoUser("Google_21903i12")).toEqual(false);
    });
  });
});
