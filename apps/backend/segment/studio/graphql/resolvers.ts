import decodeId from "~/studio/graphql/lib/decode-id";
import toConnection from "~/studio/graphql/lib/to-connection";
import { IResolver } from "~/studio/graphql/types";

const segmentObjtype = "segment";

const segment: IResolver = async (_, args, context) => {
  const response = await context.dataSources.segment.list();
  return toConnection(response.items);
};

export default {
  Query: {
    segment,
  },

  Segment: {
    __isTypeOf: (source: { id: string }) => {
      return decodeId(source?.id)?.objtype === segmentObjtype;
    },
  },
};
