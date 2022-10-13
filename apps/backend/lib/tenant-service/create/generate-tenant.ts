import { getSignInProvider, isCustomSsoUser } from "~/lib/cognito/sso";
import { addTenantToDomain } from "~/lib/domains";
import { id } from "~/lib/dynamo";
import generateWorkspaceName from "~/lib/generate-workspace-name";
import { IKickboxEmailVerificationResponse, verifyEmail } from "~/lib/kickbox";
import { ITenant, IUserSsoProvider } from "~/types.api";
import listTenants from "../list";

const RAINFOREST_QA_DOMAINS = ["e.rainforestqa.com"];

const generateTenant = async (
  userId: string,
  userEmail: string,
  referral?: string,
  tenantName?: string
): Promise<ITenant> => {
  const tenantId = id();
  const kickboxVerificationData: IKickboxEmailVerificationResponse =
    await verifyEmail(userEmail);
  const domains = kickboxVerificationData?.isCompanyEmail
    ? [kickboxVerificationData.domain]
    : [];

  const { domain, isCompanyEmail, kickbox_is_free, ...kickboxData } =
    kickboxVerificationData ?? {};

  let tenants;
  try {
    tenants = await listTenants(userId);
  } catch {
    tenants = [];
  }

  const generatedName = generateWorkspaceName(
    userEmail,
    {
      domain,
      isCompanyEmail,
    },
    tenants.map((tenant) => tenant.name)
  );
  const name = tenantName || generatedName;
  const requireSso = isCustomSsoUser(userId)
    ? (getSignInProvider(userId) as IUserSsoProvider)
    : undefined;

  if (isCompanyEmail && domain) {
    // exclude Rainforest QA domains
    if (!RAINFOREST_QA_DOMAINS.includes(domain)) {
      await addTenantToDomain(domain, tenantId);
    }
  }

  return {
    brandsAccepted: true,
    clickThroughTracking: {
      enabled: true,
    },
    created: new Date().getTime(),
    creator: userId,
    currentOnboardingStep:
      tenants.length >= 1 ? "not_applicable" : "workspace_creation_step",
    customerRoutes: {
      hmacEnabled: false,
    },
    discoverable: isCompanyEmail ? "FREE_TO_JOIN" : "RESTRICTED",
    domains,
    emailOpenTracking: {
      enabled: true,
    },
    name,
    owner: userId,
    referral_source: referral,
    showCourierFooter: true,
    tenantId,
    requireSso,
    ...kickboxData,
  };
};

export default generateTenant;
