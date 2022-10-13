import plain from "slate-plain-serializer";

import { BlockWire } from "~/types.api";

const textBlockWithLinks: BlockWire = {
  config: JSON.stringify({
    value: plain.deserialize("test"),
  }),
  id: "text-block",
  type: "text",
};

export default textBlockWithLinks;
