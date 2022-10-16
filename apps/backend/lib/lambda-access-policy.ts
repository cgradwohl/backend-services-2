import { APIGatewayAuthorizerResult } from "aws-lambda";
import { ApiVersion } from "~/send/types";
import { TenantRouting, TenantScope } from "~/types.internal";

type StringOnly<T extends { [key: string]: string }> = T;
type IBaseAuthorizerContext = StringOnly<{
  env?: string;
  scope: TenantScope;
  tenantId: string;
}>;

export type IApiAuthorizerContext = StringOnly<
  IBaseAuthorizerContext & {
    apiVersion?: ApiVersion;
    authType: "api-key";
    dryRunKey?: TenantRouting;
    translateToV2String?: string;
    shouldTranslateAndDeliverString?: string;
    useMaterializedBrandsString?: string;
    shouldUseInboundSegmentEventsKinesisString?: string;
  }
>;

export type IClientAuthorizerContext = StringOnly<
  IBaseAuthorizerContext & {
    apiVersion?: ApiVersion;
    authScope?: string;
    authType: "client-hmac" | "client-key" | "client-jwt";
    userId?: string;
    userIds?: string;
  }
>;

export type IAuthorizerContext =
  | IApiAuthorizerContext
  | IClientAuthorizerContext;
// the context type here allows numbers and objects but aws will turn them into strings
// so we want to be very specific on our types
export type ApiAuthorizerResult = Omit<
  APIGatewayAuthorizerResult,
  "context"
> & {
  context: IAuthorizerContext;
};

export default (
  principalId: "user",
  effect: "Allow" | "Deny",
  resource: string,
  context?: IAuthorizerContext
): ApiAuthorizerResult => {
  if (!resource) {
    throw new Error("Unknown Resource");
  }

  const policy: ApiAuthorizerResult = {
    context,
    policyDocument: {
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
      Version: "2012-10-17",
    },
    principalId,
  };

  return policy;
};
