import { Value, ValueJSON } from "slate";

import { Block, BlockWire } from "~/types.api";

const hydrateBlock = (block: BlockWire): Block => {
  // want to be able to remove values from the block in the migrations but
  // I do not want side effects – so create a shallow clone
  const blockWire = { ...block };

  let config = blockWire.config ? JSON.parse(blockWire.config) : {};

  // convert all Slate ValueJSON to Slate Value
  switch (blockWire.type) {
    case "text":
    case "markdown":
    case "quote":
    case "line": {
      const textConfig = config as {
        value: ValueJSON;
        locales: {
          [locale: string]: ValueJSON;
        };
      };

      if (textConfig.value) {
        config.value = Value.fromJSON(textConfig.value);
      }

      if (textConfig.locales) {
        config.locales = Object.keys(textConfig.locales).reduce(
          (acc, locale) => {
            acc[locale] = Value.fromJSON(textConfig.locales[locale]);
            return acc;
          },
          {}
        );
      }
      break;
    }

    case "list": {
      const listConfig = config as {
        child?: {
          value: ValueJSON;
        };
        top: {
          value: ValueJSON;
        };
        locales?: {
          [locale: string]: {
            children?: ValueJSON;
            parent?: ValueJSON;
          };
        };
      };

      config.top.value = Value.fromJSON(config.top.value);

      if (config.child) {
        config.child.value = Value.fromJSON(config.child.value);
      }

      if (config.locales) {
        config.locales = Object.keys(listConfig.locales).reduce(
          (acc, locale) => {
            acc[locale] = {
              children: Value.fromJSON(listConfig.locales[locale].children),
              parent: Value.fromJSON(listConfig.locales[locale].parent),
            };
            return acc;
          },
          {}
        );
      }
      break;
    }
  }

  // legacy migrations
  // we stored a json stringified object in block.value for action blocks
  if (blockWire.type === "action" && (blockWire as any).value) {
    config = {
      ...JSON.parse((blockWire as any).value),
      config,
    };
    delete (blockWire as any).value;
  }
  // we stored the slate value in block.value for old line and text blocks
  if ((blockWire as any).value) {
    config.value =
      config.value || Value.fromJSON(JSON.parse((blockWire as any).value));
    delete (blockWire as any).value;
  }
  // we stored a json object in block.configuration
  if ((blockWire as any).configuration) {
    config = {
      ...(blockWire as any).configuration,
      ...config,
    };
    delete (blockWire as any).configuration;
  }

  return {
    ...blockWire,
    config,
  };
};

export default hydrateBlock;
