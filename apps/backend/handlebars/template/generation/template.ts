import { IColumnBlockConfig, ITextBlockConfig } from "./../../../types.api.d";
import { Value } from "slate";

import getHandlebarsFromSlate from "../slate";
import getComplexHandlebarsParameter from "./get-complex-handlebars-parameter";
import getHandlebarsFromBlock from "./get-handlebars-from-block";
import getHandlebarsPartial from "./get-handlebars-partial";

import { TemplateConfig } from "~/handlebars/template/types";
import { Block, ITenant, ITextBlock } from "~/types.api";

function assertIsTextBlock(block: Block): block is ITextBlock {
  return block.type === "text";
}

const getHandlebarsTemplate = ({
  allBlocks,
  blockIdsToRender,
  config = {},
  provider,
  tenant,
}: {
  allBlocks: Block[];
  blockIdsToRender: string[];
  config?: TemplateConfig;
  provider?: string;
  tenant?: ITenant;
}): string => {
  const hydratedWithColumnBlocks = allBlocks.map((block) => {
    if (block.type !== "column") {
      return block;
    }

    const blockConfig = block.config as IColumnBlockConfig;
    const hydratedColumns = blockConfig.columns.map((column) => {
      const foundBlock = allBlocks.find(
        (block) => block.id === column.blockIds[0]
      );
      if (!foundBlock || foundBlock.type !== "text") {
        return column;
      }

      const textBlockConfig = foundBlock.config as ITextBlockConfig;

      return {
        blockIds: column.blockIds,
        border: textBlockConfig.border,
      };
    });

    return {
      ...block,
      config: {
        ...blockConfig,
        columns: hydratedColumns,
      },
    };
  });

  const blockIdsInColumns = hydratedWithColumnBlocks
    .map((block) => {
      if (block.type !== "column") {
        return;
      }

      const blockConfig = block.config as IColumnBlockConfig;
      return blockConfig.columns.map((column) => column.blockIds).flat();
    })
    .filter(Boolean)
    .flat();

  const blockInlinePartials = hydratedWithColumnBlocks
    .map((block) => {
      if (!blockIdsInColumns.includes(block.id)) {
        return;
      }

      const blockContent = getHandlebarsFromBlock(block, provider, config);
      return `{{#*inline "block-${block.id}"}}${blockContent}{{/inline}}`;
    })
    .filter(Boolean);

  const renderedBlocks = blockIdsToRender
    .map((blockId) => {
      return hydratedWithColumnBlocks.find((block) => block.id === blockId);
    })
    .filter(Boolean);

  const blockList = renderedBlocks.map((block) => {
    return getHandlebarsFromBlock(block, provider, config);
  });

  const previewTextTemplate = renderedBlocks
    .map((block) => {
      if (assertIsTextBlock(block)) {
        const locale = config?.locale;

        if (locale && block.config?.locales?.[locale]) {
          return getHandlebarsFromSlate(block.config?.locales?.[locale]);
        }

        return getHandlebarsFromSlate(block.config.value);
      }

      return "";
    })
    .join("");

  let headContent: string = "";
  let headerContent: string = "";
  let footerContent: string = "";

  if (config?.email || config.channel === "inbox") {
    const { emailTemplateConfig = {} } = config?.email ?? {};
    const {
      footerLinks,
      footerText: footerTextSlate,
      headerLogoAlign,
      headerLogoHref,
      headerLogoRenderSize,
      headerLogoSrc,
      topBarColor,
    } = emailTemplateConfig;

    headContent += getHandlebarsPartial("courier-email-head", {
      params: {
        brandEnabled: config?.brand?.enabled,
        children: previewTextTemplate,
        showCourierFooter: tenant?.showCourierFooter,
        topBarColor: getComplexHandlebarsParameter(topBarColor),
      },
    });

    headerContent += getHandlebarsPartial("courier-email-header", {
      params: {
        logoAlign: headerLogoAlign,
        logoHref: headerLogoHref,
        logoRenderSize: headerLogoRenderSize,
        logoSrc: headerLogoSrc,
        topBarColor: getComplexHandlebarsParameter(topBarColor),
      },
    });

    const footerText =
      Value.isValue(footerTextSlate) || !footerTextSlate
        ? footerTextSlate
        : Value.fromJSON(JSON.parse(footerTextSlate));

    footerContent += getHandlebarsPartial("courier-email-footer", {
      children: getHandlebarsFromSlate(footerText),
      params: {
        showCourierFooter: tenant?.showCourierFooter,
        links: footerLinks,
        tenantId: tenant?.tenantId,
      },
    });
  }

  const children = [
    headContent
      ? `{{#*inline "courier-head-content"}}${headContent}{{/inline}}`
      : undefined,
    headerContent
      ? `{{#*inline "courier-header-content"}}${headerContent}{{/inline}}`
      : undefined,
    blockInlinePartials.join(""),
    blockList.join(""),
    footerContent
      ? `{{#*inline "courier-footer-content"}}${footerContent}{{/inline}}`
      : undefined,
  ]
    .filter(Boolean)
    .join("");

  const result = getHandlebarsPartial("courier-template", { children });
  return result;
};

export default getHandlebarsTemplate;
