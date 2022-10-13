import { UnpackPromise } from "~/lib/types/unpack-promise";
import decodeId from "../lib/decode-id";
import toESConnection from "../lib/to-elastic-search-connection";
import { IResolver } from "../types";
import RecipientDataSource, { IRecipientSearchInput } from "./data-source";

type Recipient_2022_01_28 = UnpackPromise<
  ReturnType<RecipientDataSource["get"]>
>;

type ListRecipient = UnpackPromise<
  ReturnType<RecipientDataSource["getListRecipient"]>
>;

type ListRecipientUsers = UnpackPromise<
  ReturnType<RecipientDataSource["getListRecipientUsers"]>
>;

type UsersToAddToList = UnpackPromise<
  ReturnType<RecipientDataSource["getUsersToAddToList"]>
>;

const objtype = "recipient_2022_01_28";

const recipient_2022_01_28: IResolver<Recipient_2022_01_28> = (
  _,
  args,
  context
) =>
  args.recipientId
    ? context.dataSources.recipients_2022_01_28.get(args.recipientId)
    : null;

const listRecipient: IResolver<ListRecipient> = (_, args, context) =>
  args.listRecipientId
    ? context.dataSources.recipients_2022_01_28.getListRecipient(
        args.listRecipientId
      )
    : null;

const listRecipientUsers: IResolver<ListRecipientUsers> = (_, args, context) =>
  context.dataSources.recipients_2022_01_28.getListRecipientUsers(
    args.listRecipientId,
    args.after
  );

const usersToAddToList: IResolver<UsersToAddToList> = (_, args, context) =>
  args.searchTerm
    ? context.dataSources.recipients_2022_01_28.getUsersToAddToList(
        args.searchTerm,
        args.listId
      )
    : { users: [] };

const recipients_2022_01_28: IResolver = async (_, args, context) => {
  const response = await context.dataSources.recipients_2022_01_28.list(
    args as IRecipientSearchInput
  );

  return toESConnection(response.items, response?.next, response?.prev);
};

const saveUserRecipient: IResolver = async (_, args, context) => {
  const response = await context.dataSources.recipients_2022_01_28.set(
    args.recipientId,
    args.userRecipientInputData
  );
  return response;
};

const addUsersToList: IResolver = async (_, args, context, info) => {
  await context.dataSources.recipients_2022_01_28.addUsersToList(
    args.listId,
    context.userId,
    args.users
  );
  const response = await listRecipientUsers(
    _,
    {
      listRecipientId: args.listId,
    },
    context,
    info
  );
  return response;
};

const deleteUserRecipient: IResolver = async (_, args, context) => {
  const response =
    await context.dataSources.recipients_2022_01_28.deleteUserRecipient(
      args.recipientId
    );
  return response;
};

export default {
  Query: {
    recipient_2022_01_28,
    recipients_2022_01_28,
    listRecipient,
    listRecipientUsers,
    usersToAddToList,
  },

  Mutation: {
    saveUserRecipient,
    addUsersToList,
    deleteUserRecipient,
  },

  Recipient_2022_01_28: {
    __isTypeOf: (source: Recipient_2022_01_28) => {
      return decodeId(source?.id)?.objtype === objtype;
    },
  },
};
