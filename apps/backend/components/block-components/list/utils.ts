import { IListBlockConfig } from "~/types.api";

export type IHtmlListVariant = "bullet" | "images";

export const getHasChildList = (config: IListBlockConfig): boolean => {
  const { child, useChildren } = config;
  return child && child.path && useChildren;
};

export const getHtmlListVariant = (
  config: IListBlockConfig
): IHtmlListVariant => {
  const { child, top, useImages } = config;
  const { background, imagePath } = top;

  const hasChildList = getHasChildList(config);
  const childImagePath = useImages && hasChildList && child && child.imagePath;
  const transparentBackground = !background || background === "transparent";

  return transparentBackground &&
    !useImages &&
    (!imagePath || !hasChildList || !childImagePath)
    ? "bullet"
    : "images";
};

export const getHtmlListChildVariant = (
  config: IListBlockConfig
): IHtmlListVariant => {
  const { child, top } = config;
  const { background = "transparent" } = top;

  return background !== "transparent" ||
    (getHtmlListVariant(config) === "images" && child.imagePath)
    ? "images"
    : "bullet";
};
