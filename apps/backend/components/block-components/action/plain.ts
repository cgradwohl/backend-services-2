import { ISerializableBlock } from "~/lib/blocks/serialize";
import { IActionBlockConfig } from "~/types.api";

const actionRendererPlain = (
  config: IActionBlockConfig,
  block: ISerializableBlock
) => {
  const { links, scope } = block;
  const text = scope.replace(config.text);
  const href = links.getHref("action", scope.replace(config.href));

  return `${text}: ${href}`;
};

export default actionRendererPlain;
