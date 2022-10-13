import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { IConnection, IEdge, INode } from "../types";

export default <T extends INode>(
  nodes: T[],
  lastEvaluatedKey?: DocumentClient.Key
): IConnection<T> => {
  const edges: Array<IEdge<T>> = nodes.map((node) => ({
    cursor: node.id,
    node,
  }));

  const leadingEdge = edges[0];
  const trailingEdge = edges[edges.length - 1];

  return {
    edges,
    nodes,
    pageInfo: {
      endCursor: trailingEdge?.cursor ?? null,
      hasNextPage: !!lastEvaluatedKey,
      // TODO: do better
      hasPreviousPage: false,
      startCursor: leadingEdge?.cursor ?? null,
    },
  };
};
