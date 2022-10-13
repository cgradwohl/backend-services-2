import { KeyUtils, Value, ValueJSON, ValueProperties } from "slate";

const generateSlateDocument = (
  properties: ValueProperties | ValueJSON
): Value => {
  /*
    When Slate generates a Document, it assigns "keys" to each node incrementally...
    If I generate 2 Documents right after eachother the key incrementation doesn't start back at 0.
    We need the node key to be deterministic so we can map the source node key to the override node key.
    Resetting the generator starts the keys back at 0 again.
   */
  KeyUtils.resetGenerator();
  return Value.fromJSON(properties);
};

export default generateSlateDocument;
