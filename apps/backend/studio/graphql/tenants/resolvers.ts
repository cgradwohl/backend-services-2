import decodeId from "../lib/decode-id";
import toConnection from "../lib/to-connection";
import { IResolver } from "../types";

const objtype = "tenant";

const setSetUpInfo: IResolver = async (_, args, context) => {
  return context.dataSources.tenants.setSetUpInfo(
    args.channelInterests,
    args.stackLang
  );
};

const setCurrentOnboardingStep: IResolver = async (_, args, context) => {
  return context.dataSources.tenants.setCurrentOnboardingStep(
    args.currentOnboardingStep
  );
};

const setTenantName: IResolver = async (_, args, context) => {
  return context.dataSources.tenants.setName(args.name);
};

const archiveTenant: IResolver = async (_, args, context) => {
  return context.dataSources.tenants.archive();
};

const setHideSetupProgress: IResolver = async (_, args, context) => {
  return context.dataSources.tenants.setHideSetupProgress(args.hide);
};

const setShowCourierFooter: IResolver = async (_, args, context) => {
  return context.dataSources.tenants.setShowCourierFooter(args.show);
};

const setHmacEnabled: IResolver = async (_, args, context) => {
  return context.dataSources.tenants.setHmacEnabled(args.hmacEnabled);
};

const sendWorkspaceLink: IResolver = async (_, args, context) => {
  return context.dataSources.tenants.sendWorkspaceLink(args.payload);
};

const tenant: IResolver = async (_, __, context) => {
  return context.dataSources.tenants.current();
};

const tenants: IResolver = async (_, __, context) => {
  const response = await context.dataSources.tenants.list(context.user.id);
  return toConnection(response.items, response.lastEvaluatedKey);
};

export default {
  Query: {
    tenants,
  },

  Mutation: {
    setHmacEnabled,
    sendWorkspaceLink,
    setHideSetupProgress,
    setSetUpInfo,
    setCurrentOnboardingStep,
    setShowCourierFooter,
    setTenantName,
    archiveTenant,
  },

  Tenant: {
    __isTypeOf: (source: { id: string }) => {
      return decodeId(source?.id)?.objtype === objtype;
    },
  },

  Viewer: {
    tenant,
  },
};
