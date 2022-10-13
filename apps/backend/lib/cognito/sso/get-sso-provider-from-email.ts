/**
 * Returns SSO IdP for the email if it uses one, undefined otherwise.
 *
 * Note SsoProviderCognitoId differs from SsoProvider / SignInProvider in that it is not prefixed with.
 * "custom:". This is because the ID registered with cognito is not prefixed with "custom:".
 *
 * F.A.Q:
 * - Why do we check the email for SSO? Some customers use a custom SSO/IdP that is tied to their domain.
 *
 * The SSO IdPs are hardcoded for now but will likely be from a table in the future.
 */
export async function getSsoProviderCognitoIdFromEmail(
  email: string
): Promise<string | undefined> {
  const domain = extractDomainFromEmail(email);
  return {
    "benevity.com": "OktaBenevity",
    "color.com": "OktaColor",
    "color-ext.com": "OktaColor",
    "drata.com": "OktaDrata",
    "drew-dev.com": "OktaDrewDev",
    "earnestresearch.com": "OktaEarnestResearch",
    "expel.io": "OktaExpel",
    "expel.com": "OktaExpel",
    "lattice.com": "OktaLattice",
    "latticehq.com": "OktaLattice",
    "launchdarkly.com": "OktaLaunchDarkly",
    "oysterhr.com": "OktaOyster",
    "newrelic.com": "OktaNewRelic",
    "seermedical.com": "OktaSeer",
    "youngwerth.com": "OktaDrewDev",
  }[domain];
}

export function extractDomainFromEmail(email: string): string | undefined {
  const atIndex = email.indexOf("@");
  if (atIndex < 0) return undefined;
  return email.substr(atIndex + 1);
}
