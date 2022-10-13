import { BlockWire } from "~/types.api";

const listBlockWithLinks: BlockWire = {
  config:
    '{"child":{"imageHref":"","imagePath":"","path":"childList","value":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"","marks":[]},{"object":"inline","type":"link","data":{"href":"https://example.com/{value}","text":"{value}"},"nodes":[{"object":"text","text":"{value}","marks":[]}]},{"object":"text","text":"","marks":[]}]}]}}},"top":{"background":"transparent","imageHref":"","imagePath":"","path":"list","value":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"","marks":[]},{"object":"inline","type":"link","data":{"href":"https://example.com/{value}","text":"{value}"},"nodes":[{"object":"text","text":"{value}","marks":[]}]},{"object":"text","text":"","marks":[]}]}]}}},"useChildren":true,"useImages":false}',
  id: "list-block",
  type: "list",
};

export default listBlockWithLinks;
