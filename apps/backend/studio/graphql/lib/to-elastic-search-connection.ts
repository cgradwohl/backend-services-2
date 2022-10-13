import { encode } from "~/lib/base64";
import { IConnection, IEdge, INode } from "../types";

export default <T extends INode>(
  nodes: T[],
  next?: string,
  prev?: string
): IConnection<T> => {
  const edges: Array<IEdge<T>> = nodes.map((node) => ({
    cursor: encode(node.id),
    node,
  }));

  return {
    edges,
    nodes,
    pageInfo: {
      endCursor: prev ? encode(prev) : null,
      hasNextPage: Boolean(next),
      hasPreviousPage: Boolean(prev),
      startCursor: next ? encode(next) : null,
    },
  };
};
