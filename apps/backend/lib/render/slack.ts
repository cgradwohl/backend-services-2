import { IProviderRenderHandler } from "~/providers/types";
import renderBlocks from "./blocks";

const renderSlack: IProviderRenderHandler = (blocks) => {
  return {
    slackBlocks: renderBlocks(blocks, "slack"),
    text: renderBlocks(
      blocks.filter(({ type }) => type !== "action"), // remove action blocks from plain text so we don't get link previews
      "plain"
    ).join("\n\n"),
  };
};

export default renderSlack;
