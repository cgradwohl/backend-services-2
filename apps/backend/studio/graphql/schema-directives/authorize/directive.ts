// Based on https://www.apollographql.com/docs/apollo-server/schema/creating-directives/#enforcing-access-permissions

import { ForbiddenError, SchemaDirectiveVisitor } from "apollo-server-lambda";
import { defaultFieldResolver, GraphQLField, GraphQLObjectType } from "graphql";

import assertHasCapability, {
  CapabilityAssertionError,
} from "~/lib/access-control/assert-has-capability";
import { Action } from "~/lib/access-control/types";
import { IContext } from "../../types";

export default class AuthorizeDirective extends SchemaDirectiveVisitor {
  public visitFieldDefinition(field: GraphQLField<any, IContext>) {
    const { capability } = this.args;
    this.applyAuthorizer(field, capability);
  }

  public visitObject(objectType: GraphQLObjectType) {
    const { capability } = this.args;
    const fields = objectType.getFields();

    for (const key in fields) {
      if (key in fields) {
        const field = fields[key];
        this.applyAuthorizer(field, capability);
      }
    }
  }

  private applyAuthorizer(
    field: GraphQLField<any, IContext>,
    capability: string
  ) {
    const { resolve = defaultFieldResolver } = field;
    field.resolve = async function (...args: any[]) {
      const context = args[2] as IContext;

      try {
        assertHasCapability(
          context.user.role,
          capability as Action,
          "*" // TODO: support resource identification
        );
      } catch (err) {
        if (err instanceof CapabilityAssertionError) {
          throw new ForbiddenError("Forbidden");
        }

        throw err;
      }

      return resolve.apply(this, args);
    };
  }
}
