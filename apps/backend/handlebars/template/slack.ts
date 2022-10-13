import handlebars from "handlebars";

import courierHandlebarsHelpers from "../helpers";
import courierHandlebarsPartials from "../partials";
import IHandlebarsCompileOptions from "../partials/compile-options";
import compilePartialsObject from "../partials/compile-partials-object";
import lineReturns from "./line-returns";
import { ITemplateHandler } from "./types";

const compileOptions: IHandlebarsCompileOptions = {
  noEscape: true, // TODO: change to false after handlebars transition
};

import slackifyMarkdown from "~/lib/slackify-markdown";
import { fixBoldMarkdownEdgeCase } from "./lib";

// TODO: Remove tenantId param - Used to verify bold whitespace edge case fix
export const searchAndSlackifyBlocks = (entry, tenantId: string) => {
  if (entry === null || entry === undefined) {
    return entry;
  }

  if (Array.isArray(entry)) {
    return entry.map((block) => {
      return searchAndSlackifyBlocks(block, tenantId);
    });
  }

  if (typeof entry === "object") {
    const { slackify, ...block } = entry;

    if (slackify && entry.text && block.type === "mrkdwn") {
      return {
        ...block,
        text: slackifyMarkdown(entry.text ?? ""),
      };
    }

    if (entry.text && block.type === "mrkdwn") {
      entry.text = fixBoldMarkdownEdgeCase({
        md: entry.text,
        marker: "*",
        tenantId,
      });
    }

    return Object.keys(entry).reduce((acc, key) => {
      acc[key] = searchAndSlackifyBlocks(entry[key], tenantId);
      return acc;
    }, {});
  }

  return entry;
};

/**
 * Given a compiled Handlebars template and fallback text, take a context,
 * variableHandler, and linkHandler and render the handlebars template.
 */
const getSlackTemplateHandler = (
  templateString: string
): ITemplateHandler<"slack">["render"] => {
  const template = handlebars.compile(templateString, compileOptions);

  // handler with consistent interface
  return (variableHandler, linkHandler, data) => {
    const context = variableHandler.getContext().value;

    const slackBlocks: object[] = [];

    // blockHandler will simply add the blocks to our slackBlocks array
    const blockHandler = (block: object) => {
      const slackified = searchAndSlackifyBlocks(
        block,
        ((data ?? {}).tenantId as string) ?? ""
      );

      if (Array.isArray(slackified)) {
        slackBlocks.push(...slackified);
      } else {
        slackBlocks.push(slackified);
      }
    };

    // don't use the returned string
    template(context, {
      data: {
        ...data,
        blockHandler,
        blockSeparator: "\n",
        lineReturn: lineReturns.slack,
        linkHandler: linkHandler.getScopedHandler("slack"),
        serializer: "slack",
        variableHandler,
      },
      helpers: {
        ...courierHandlebarsHelpers.universal,
        ...courierHandlebarsHelpers.slack,
      },
      partials: compilePartialsObject(
        courierHandlebarsPartials.slack,
        compileOptions
      ),
    });

    // return the slack blocks caught by the blockHandler
    return slackBlocks;
  };
};

/**
 * Return the handler with a discriminant (`type`) so we can maintain type
 * safety.
 */
const getSlackHandlebarsTemplate = (
  template: string
): ITemplateHandler<"slack"> => ({
  render: getSlackTemplateHandler(template),
  type: "slack",
});

export default getSlackHandlebarsTemplate;
