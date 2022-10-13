import { makeExecutableSchema } from "apollo-server-lambda";

import resolvers from "./resolvers";
import schemaDirectives from "./schema-directives";
import typeDefs from "./type-defs";

export default makeExecutableSchema({
  resolverValidationOptions: {
    // https://github.com/apollographql/apollo-server/issues/1075
    requireResolversForResolveType: false,
  },
  resolvers,
  schemaDirectives,
  typeDefs,
});
