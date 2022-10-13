// Based on https://www.apollographql.com/docs/apollo-server/schema/creating-directives/#enforcing-access-permissions
import { ForbiddenError, SchemaDirectiveVisitor } from "apollo-server-lambda";
import { defaultFieldResolver, GraphQLField, GraphQLObjectType } from "graphql";
import { IContext } from "../../types";

export default class AuthorizeDirective extends SchemaDirectiveVisitor {
  public visitFieldDefinition(field: GraphQLField<any, IContext>) {
    const { scope } = this.args;
    this.applyAuthorizer(field, scope);
  }

  public visitObject(objectType: GraphQLObjectType) {
    const { scope } = this.args;
    const fields = objectType.getFields();

    for (const key in fields) {
      if (key in fields) {
        const field = fields[key];
        this.applyAuthorizer(field, scope);
      }
    }
  }

  // When client-jwt auth is used, we can check scope to ensure JWT has the correct permissions.
  // Client-hmac's are all-powerful.
  private applyAuthorizer(field: GraphQLField<any, IContext>, scope: string) {
    const { resolve = defaultFieldResolver } = field;
    field.resolve = async function (...args: any[]) {
      const context = args[2] as IContext;

      if (context.authType === "client-jwt") {
        const passedScope = context.authScope;
        const hasScope = passedScope.includes(scope);
        if (!hasScope) {
          throw new ForbiddenError("Forbidden");
        }
      }

      return resolve.apply(this, args);
    };
  }
}
