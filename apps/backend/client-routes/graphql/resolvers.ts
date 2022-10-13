import extend from "deep-extend";
import { GraphQLDateTime } from "graphql-custom-types";
import GraphQLJSON from "graphql-type-json";
import brands from "./brands/resolver";
import messages from "./messages/resolver";
import node from "./node/resolver";
import { preferencePage } from "./preferences/page/resolver";
import { preferenceSections } from "./preferences/sections/resolver";
import { preferences } from "./preferences/templates/resolver";
export default extend(
  {
    DateTime: GraphQLDateTime,
    JSON: GraphQLJSON,
  },
  messages,
  brands,
  node,
  preferences,
  preferenceSections,
  preferencePage
);
