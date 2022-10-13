import { IResolver } from "../types";

const objtype = "end-user";

const getRecipientUserTokens: IResolver<{ userId: string }> = (
  _,
  args,
  context
) => context.dataSources.recipientUsers.getRecipientUserTokens(args.userId);

export default {
  Query: {
    getRecipientUserTokens,
  },
};
