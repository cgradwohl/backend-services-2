import { ISerializableBlock } from "~/lib/blocks/serialize";
import { IActionBlockConfig } from "~/types.api";

const actionRendererMd = (
  config: IActionBlockConfig,
  block: ISerializableBlock
) => {
  const { links, scope } = block;
  const href = links.getHref("action", scope.replace(config.href));
  const text = scope.replace(config.text);

  return `[${text}](${href})`;
};

export default actionRendererMd;
