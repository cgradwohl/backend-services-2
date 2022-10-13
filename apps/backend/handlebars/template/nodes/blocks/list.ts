import { Value } from "slate";
import { IListBlock, IListBlockChildConfig } from "~/types.api";

import getComplexHandlebarsParameter from "../../generation/get-complex-handlebars-parameter";
import getHandlebarsParameter from "../../generation/get-handlebars-parameter";
import getHandlebarsPartial from "../../generation/get-handlebars-partial";
import { ISafeParameterValue } from "../../generation/safe-parameter-value";
import getHandlebarsFromSlate from "../../slate";
import { TemplateConfig } from "../../types";

const getHandlebarsFromChildList = (
  child: IListBlockChildConfig | undefined,
  background: ISafeParameterValue,
  variant: "bullets" | "images" | "numbered" | undefined,
  topHasImages: boolean,
  templateConfig: TemplateConfig,
  locales?: {
    [locale: string]: {
      children?: Value;
      parent?: Value;
    };
  }
): string => {
  if (!child) {
    return "";
  }

  const { imageHref, imagePath, path: pathString, value, ...options } = child;

  const childrenValue = templateConfig?.locale
    ? locales?.[templateConfig.locale]?.children ?? value
    : value;

  const children = getHandlebarsFromSlate(childrenValue);
  const path = getHandlebarsParameter(pathString);
  const content = getHandlebarsPartial("list-block-child", {
    children,
    params: {
      ...options,
      background,
      imageHref:
        variant === "images" ? getComplexHandlebarsParameter(imageHref) : "",
      imagePath:
        variant === "images" ? getComplexHandlebarsParameter(imagePath) : "",
      topHasImages,
      variant,
    },
  });

  return `{{#each (get-list-items ${path})}}${content}{{/each}}`;
};

const getHandlebarsFromListBlock = (
  block: IListBlock,
  templateConfig?: TemplateConfig
) => {
  const {
    child,
    top,
    useChildren,
    useImages,
    useNumbers,
    locales,
  } = block.config;
  const {
    background: bg,
    imageHref,
    imagePath,
    path: unsafePath,
    value,
    ...options
  } = top;
  const background = getComplexHandlebarsParameter(
    bg && bg !== "transparent" ? bg : undefined
  );

  const parentValue = templateConfig?.locale
    ? locales?.[templateConfig.locale]?.parent ?? value
    : value;

  const parent = getHandlebarsFromSlate(parentValue);
  const hasChildList = child && child.path && useChildren;
  const childImagePath = useImages && hasChildList && child && child.imagePath;
  const path = getHandlebarsParameter(unsafePath);

  const hasImages = Boolean(useImages && imagePath.trim());
  const hasChildImages =
    hasChildList && useImages && childImagePath.trim() ? true : undefined;

  const variant = useNumbers
    ? "numbers"
    : !background && !useImages && !hasChildImages
    ? "bullets"
    : hasImages
    ? "images"
    : undefined; // list with bg and no images

  const childVariant =
    !background && !hasChildImages
      ? "bullets"
      : hasChildImages
      ? "images"
      : undefined; // list with bg and no images

  const childList = hasChildList
    ? getHandlebarsFromChildList(
        child,
        background,
        childVariant,
        hasImages,
        templateConfig,
        locales
      )
    : "";

  const childContent = childList
    ? `{{#*inline "child-content"}}${childList}{{/inline}}`
    : "";

  const topContent = getHandlebarsPartial("list-block-top", {
    children: parent + childContent,
    params: {
      ...options,
      background,
      childVariant: hasChildList ? childVariant : undefined,
      hasChildImages,
      hasChildren: hasChildList ? true : undefined,
      imageHref: useImages
        ? getComplexHandlebarsParameter(imageHref)
        : undefined,
      imagePath: useImages
        ? getComplexHandlebarsParameter(imagePath)
        : undefined,
      variant,
    },
  });

  const content = `{{#each (get-list-items ${path})}}${topContent}{{/each}}`;

  return getHandlebarsPartial("list-block", {
    children: content,
    params: {
      hasChildren: hasChildList ? true : undefined,
      variant,
    },
  });
};

export default getHandlebarsFromListBlock;
