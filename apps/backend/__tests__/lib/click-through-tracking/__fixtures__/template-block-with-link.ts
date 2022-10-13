import { BlockWire } from "~/types.api";

const templateBlockWithLink: BlockWire = {
  config: JSON.stringify({
    template: '<a href="https://example.com">test link</a>',
  }),
  id: "template-block-with-link",
  type: "template",
};

export default templateBlockWithLink;
