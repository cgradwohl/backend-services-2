import { BlockWire } from "~/types.api";

const textBlockWithLinks: BlockWire = {
  config:
    '{"value":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"A ","marks":[]},{"object":"inline","type":"link","data":{"href":"https://example.com","text":"link"},"nodes":[{"object":"text","text":"link","marks":[]}]},{"object":"text","text":" in some text.","marks":[]}]}]}}}',
  id: "text-block-with-link",
  type: "text",
};

export default textBlockWithLinks;
