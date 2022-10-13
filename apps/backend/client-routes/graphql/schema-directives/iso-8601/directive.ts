import { SchemaDirectiveVisitor } from "apollo-server-lambda";
import { defaultFieldResolver, GraphQLField } from "graphql";
import { IContext } from "../../types";

export default class ISO8601Directive extends SchemaDirectiveVisitor {
  public visitFieldDefinition(field: GraphQLField<number, IContext>) {
    const { resolve = defaultFieldResolver } = field;

    field.resolve = async function (...args) {
      const result = await resolve.apply(this, args);
      return result ? new Date(result).toISOString() : result;
    };
  }
}
