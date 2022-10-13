const SERVICE_API = "api";
const SERVICE_STUDIO = "studio-backend";
const SERVICE_WORKER = "workers";
const SERVICE_UNCLASSIFIED = "unclassified";

const SERVICE_NAME_MAP = {
  CheckBetaAccessCode: SERVICE_STUDIO,
  LibraryGetSignedPostData: SERVICE_STUDIO,
  TenantAddUser: SERVICE_STUDIO,
  TenantChangeOwner: SERVICE_STUDIO,
  TenantsCreate: SERVICE_STUDIO,
  TenantsGet: SERVICE_STUDIO,
  TenantsList: SERVICE_STUDIO,
  TenantsListUsers: SERVICE_STUDIO,
  VerifyEmail: SERVICE_STUDIO,

  MessagesToElasticSearchStream: SERVICE_WORKER,
  PostConfirmation: SERVICE_WORKER,
  PreSignUp: SERVICE_WORKER,
};

export default function getSentryServiceTag(functionName: string) {
  if (process.env.SENTRY_SERVICE_NAME) {
    return process.env.SENTRY_SERVICE_NAME;
  }

  if (SERVICE_NAME_MAP[functionName]) {
    return SERVICE_NAME_MAP[functionName];
  }

  if (functionName.match(/^Api/)) {
    return SERVICE_API;
  }

  if (functionName.match(/^Studio/)) {
    return SERVICE_STUDIO;
  }

  if (functionName.match(/^Workers?/)) {
    return SERVICE_WORKER;
  }

  return SERVICE_UNCLASSIFIED;
}
