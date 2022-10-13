import { IFieldResolver } from "apollo-server-lambda";
import { IRole } from "~/lib/access-control/types";
import { IUserProvider } from "~/types.api";
import { TenantScope } from "~/types.internal";
import dataSources from "./data-sources";

export interface IConnection<T extends INode> {
  edges: Array<IEdge<T>>;
  nodes: T[];
  pageInfo: IPageInfo;
}

export interface IContext {
  dataSources: ReturnType<typeof dataSources>;
  env: string;
  scope: TenantScope;
  tenantId: string;
  user: {
    email: string;
    emailVerified: boolean;
    id: string;
    provider: IUserProvider;
    role: IRole;
  };
  userId: string;
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

export type NodeType = "user" | "tenant";
