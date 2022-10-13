import generateSlateDocument from "~/lib/blocks/generate-slate-document";
import htmlToSlate from "~/lib/blocks/html-to-slate";
import { NotFound } from "~/lib/http-errors";
import {
  CourierObject,
  INotificationJsonWire,
  ITemplateLocaleBlock,
  ITemplateLocales,
} from "~/types.api";
import { IApiNotificationPutBlockLocales } from "~/types.public";

export const transformRequest = (
  template: CourierObject<INotificationJsonWire>,
  blockId: string, // External API facing blockId; prefixes with `block_`
  locales: ITemplateLocales,
  incomingLocales: IApiNotificationPutBlockLocales
) => {
  const internalBlockId = blockId.replace("block_", "");

  const targetBlock = template?.json?.blocks?.find(
    (block) => block.id === internalBlockId
  );

  if (!targetBlock) {
    throw new NotFound("Block does not exist");
  }

  const blockConfig = JSON.parse(targetBlock.config);

  switch (targetBlock.type) {
    case "quote":
    case "markdown":
    case "text": {
      const sourceSlateValue = generateSlateDocument(blockConfig.value);

      for (const locale of Object.keys(incomingLocales ?? {})) {
        locales[locale] = locales?.[locale] ?? {
          blocks: [],
          channels: [],
        };

        const localeString = incomingLocales?.[locale] as string;

        const localeSlateContent = generateSlateDocument(
          htmlToSlate(localeString, sourceSlateValue) as object
        );

        const localeBlock: ITemplateLocaleBlock = {
          content: localeSlateContent.toJSON(),
          id: internalBlockId,
          type: targetBlock.type,
        };

        const localeBlockIndex = locales?.[locale].blocks?.findIndex(
          (localizedBlock) => localizedBlock.id === internalBlockId
        );

        if (localeBlockIndex >= 0) {
          locales[locale].blocks[localeBlockIndex] = {
            ...localeBlock,
          };
        } else {
          locales[locale].blocks.push({ ...localeBlock });
        }
      }
      break;
    }
    case "action": {
      for (const locale of Object.keys(incomingLocales ?? {})) {
        locales[locale] = locales?.[locale] ?? {
          blocks: [],
          channels: [],
        };

        const localeString = incomingLocales?.[locale] as string;

        const localeBlock: ITemplateLocaleBlock = {
          content: localeString,
          id: internalBlockId,
          type: targetBlock.type,
        };

        const localeBlockIndex = locales?.[locale].blocks?.findIndex(
          (localizedBlock) => localizedBlock.id === internalBlockId
        );

        if (localeBlockIndex >= 0) {
          locales[locale].blocks[localeBlockIndex] = {
            ...localeBlock,
          };
        } else {
          locales[locale].blocks.push({ ...localeBlock });
        }
      }
      break;
    }
    case "template": {
      const style = blockConfig.template.match(
        /<style>(.|\n)*?<\/style>/g
      )?.[0];

      for (const locale of Object.keys(incomingLocales ?? {})) {
        locales[locale] = locales?.[locale] ?? {
          blocks: [],
          channels: [],
        };

        const localeString = incomingLocales?.[locale] as string;

        const content = style ? style + "\n" + localeString : localeString;

        const localeBlock: ITemplateLocaleBlock = {
          content,
          id: internalBlockId,
          type: targetBlock.type,
        };

        const localeBlockIndex = locales?.[locale].blocks?.findIndex(
          (localizedBlock) => localizedBlock.id === internalBlockId
        );

        if (localeBlockIndex >= 0) {
          locales[locale].blocks[localeBlockIndex] = {
            ...localeBlock,
          };
        } else {
          locales[locale].blocks.push({ ...localeBlock });
        }
      }
      break;
    }
    case "list": {
      const sourceChildSlateValue = generateSlateDocument(
        blockConfig.child?.value
      );

      const sourceTopSlateValue = generateSlateDocument(blockConfig.top?.value);

      for (const locale of Object.keys(incomingLocales ?? {})) {
        locales[locale] = locales?.[locale] ?? {
          blocks: [],
          channels: [],
        };

        const localeString = incomingLocales?.[locale] as {
          parent: string;
          children: string;
        };

        const localeChildSlateContent = generateSlateDocument(
          htmlToSlate(localeString.children, sourceChildSlateValue) as object
        );

        const localeTopSlateContent = generateSlateDocument(
          htmlToSlate(localeString.parent, sourceTopSlateValue) as object
        );

        const localeBlock: ITemplateLocaleBlock = {
          content: {
            children: localeChildSlateContent.toJSON(),
            parent: localeTopSlateContent.toJSON(),
          },
          id: internalBlockId,
          type: targetBlock.type,
        };

        const localeBlockIndex = locales?.[locale].blocks?.findIndex(
          (localizedBlock) => localizedBlock.id === internalBlockId
        );

        if (localeBlockIndex >= 0) {
          locales[locale].blocks[localeBlockIndex] = {
            ...localeBlock,
          };
        } else {
          locales[locale].blocks.push({ ...localeBlock });
        }
      }
      break;
    }
  }
  return locales;
};
