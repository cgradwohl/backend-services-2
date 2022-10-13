import {
  extractDomainFromEmail,
  getSsoProviderCognitoIdFromEmail,
} from "~/lib/cognito/sso/get-sso-provider-from-email";

describe("Get identity provider of email if there is one", () => {
  it("extracts the domain from an email address", () => {
    expect(extractDomainFromEmail("drew@youngwerth.com")).toEqual(
      "youngwerth.com"
    );
  });

  it("returns the correct provider for an email", async () => {
    const provider = await getSsoProviderCognitoIdFromEmail(
      "drew@youngwerth.com"
    );
    expect(provider).toEqual("OktaDrewDev");
  });
});
