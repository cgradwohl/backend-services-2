import { IFieldResolver } from "apollo-server-lambda";
import { RequestAuthType } from "~/lib/lambda-response";
import { TenantScope } from "~/types.internal";
import MessagesDataSource from "./messages/data-source";
import dataSources from "./data-sources";

export interface IConnection<T extends INode> {
  edges: Array<IEdge<T>>;
  nodes: T[];
  pageInfo: IPageInfo;
}

export interface IContext {
  dataSources: ReturnType<typeof dataSources>;
  authType: RequestAuthType;
  authScope?: string; // Permissions granted by ApiGateway Authorizer
  scope: TenantScope;
  tenantId: string;
  recipientId: string;
  user?: {
    id: string;
  };
  env: string;
  userIds?: string[];
}

export interface IEdge<T extends INode> {
  cursor: string;
  node: T;
}

export interface INode {
  id: string;
}

export interface IPageInfo {
  endCursor: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string;
}

export interface IResolver<
  TSource = undefined,
  TContext extends IContext = IContext
> extends IFieldResolver<TSource, TContext> {}
