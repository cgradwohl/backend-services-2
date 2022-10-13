import { IDividerBlockConfig } from "../../types.api";
import { IBlockRenderer, ISlackBlock } from "../../types.internal";

const dividerRenderer: IBlockRenderer = (block, serializerType) => {
  const { config: blockConfig } = block;
  const dividerBlockConfig = blockConfig as IDividerBlockConfig;
  let dividerColor = block.scope.replace(
    dividerBlockConfig.dividerColor || "#CBD5E0"
  );

  if (dividerColor && dividerColor.includes("{brand.colors")) {
    dividerColor = "#CBD5E0";
  }

  if (serializerType === "slack") {
    const slackBlock: ISlackBlock = {
      type: "divider",
    };

    return slackBlock;
  }

  if (serializerType === "md" || serializerType === "plain") {
    return `---`;
  }

  return `
    <mj-section css-class="c--block c--block-divider">
      <mj-column padding="10px 0px">
        <mj-divider container-background-color="#ffffff" border-width="1px" border-color="${dividerColor}" padding="0px"/>
      </mj-column>
    </mj-section>
  `;
};

export default dividerRenderer;
