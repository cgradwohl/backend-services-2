import createEncodedId from "../lib/create-encoded-id";
import decodeId from "../lib/decode-id";
import { IResolver } from "../types";

const objtype = "user";

const role: IResolver<{ id: string }> = (source, _, context) =>
  context.dataSources.users.getRole(source.id);

const signature: IResolver<{ id: string }> = async (
  _source,
  _args,
  context
) => {
  return context.dataSources.users.getSignature();
};

const uservoiceToken: IResolver<{ id: string }> = async (
  _source,
  _args,
  context
) => {
  return context.dataSources.users.getUservoiceJWT();
};

const setRole: IResolver = async (_, args, context) => {
  await context.dataSources.users.setRole(args.userId, args.role);
  return {
    role: args.role,
    success: true,
  };
};

const updateUserDetails: IResolver = async (_, args, context) => {
  await context.dataSources.users.updateUserDetails(
    args.userId,
    args.marketingRole,
    args.firstName,
    args.lastName
  );
  return {
    userId: args.userId,
    success: true,
  };
};

const user: IResolver = (_, args, context) =>
  context.dataSources.users.get(args.userId);

const viewer: IResolver = (_, __, context) => {
  return {
    email: context.user.email,
    emailVerified: context.user.emailVerified,
    id: createEncodedId(context.user.id, objtype),
    provider: context.user.provider,
    role: context.user.role,
    userId: context.user.id,
  };
};

export default {
  Mutation: {
    setRole,
    updateUserDetails,
  },
  Query: {
    user,
    viewer,
  },

  Viewer: {
    signature,
    uservoiceToken,
  },

  User: {
    __isTypeOf: (source: { id: string }) => {
      return decodeId(source?.id)?.objtype === objtype;
    },

    role,
  },
};
