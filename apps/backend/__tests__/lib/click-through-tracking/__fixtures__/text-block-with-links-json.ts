import { BlockWire } from "~/types.api";

const textBlockWithLinks: BlockWire = {
  config:
    '{"value":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"Text with multiple links: ","marks":[]},{"object":"inline","type":"link","data":{"href":"https://example.com/a","text":"a"},"nodes":[{"object":"text","text":"a","marks":[]}]},{"object":"text","text":", ","marks":[]},{"object":"inline","type":"link","data":{"href":"https://example.com/b","text":"b"},"nodes":[{"object":"text","text":"b","marks":[]}]},{"object":"text","text":", ","marks":[]},{"object":"inline","type":"link","data":{"href":"https://example.com/c","text":"c"},"nodes":[{"object":"text","text":"c","marks":[]}]},{"object":"text","text":".","marks":[]}]}]}}}',
  id: "text-block-with-links",
  type: "text",
};

export default textBlockWithLinks;
