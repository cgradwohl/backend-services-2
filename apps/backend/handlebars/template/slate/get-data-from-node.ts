import { BlockJSON, Data, InlineJSON, MarkJSON } from "slate";

export interface INodeWithData {
  data: Data;
  toJSON(): BlockJSON | MarkJSON | InlineJSON;
}

const getDataFromSlateNode = (node: INodeWithData): MarkJSON["data"] => {
  // Slate adds additional metadata that we don't care about. toJSON() removes
  // those properties and leaves us with the keys we want to turn into hash
  // parameters
  const { data } = node.toJSON();

  return data;
};

export default getDataFromSlateNode;
