import { IListBlockConfig } from "~/types.api";
import * as colors from "../../colors";
import { IListBlockConfigWithChildren } from "../../types";
import { getHtmlListChildVariant } from "../../utils";
import { IHtmlImageListColumnStyles } from "./columns";

export interface IHtmlImageListChildStyles extends IHtmlImageListColumnStyles {
  rowStyle: string;
}

export interface IHtmlImageListBulletChildStyles {
  rowStyle: string;
  colPadding?: string;
  colSpan: number;
}

export interface IHtmlImageListTopStyles extends IHtmlImageListColumnStyles {
  itemStyle: string;
  rowStyle: string;
}

interface IHtmlImageListStyles {
  item: (
    index: number,
    last: number,
    hasChildren: boolean
  ) => IHtmlImageListTopStyles;
  itemChild?: (
    index?: number,
    last?: number
  ) => IHtmlImageListChildStyles | IHtmlImageListBulletChildStyles;
}

const emailWidth = 560;
const sectionPadding = 20;
const paddingHorizontal = 20;
const paddingHorizontalInner = 10;
const paddingVertical = 10;
const childVerticalPadding = 10;
const imageSizeToWidth = {
  small: 26,
};

// format an array of numbers for use as a padding style value
const padding = (values: number[]) => values.join("px ") + "px";

const getListChildStyleHandler = (
  config: IListBlockConfig,
  itemImageWidth: number,
  tableWidth: number,
  paddingHorizontalOuter: number
): IHtmlImageListStyles["itemChild"] => {
  if (!config.child) {
    return undefined;
  }

  const { background = "transparent" } = config.top;
  const { imagePath } = config.child;
  const variant = getHtmlListChildVariant(config);

  const transparent = background === "transparent";

  const imageWidth =
    variant === "images" && imagePath ? imageSizeToWidth.small : 0;
  const textColSpan = config.top.imagePath && !imagePath ? 2 : 1;

  const borderWidth = transparent ? 0 : 1;
  const colorName = colors.colorNames[background];
  const borderColor = colors.borders[colorName];

  const rowStylesBase = !transparent
    ? [`border:${borderWidth}px solid ${borderColor}`, "border-top:none"]
    : [];

  return (index: number = 0, last: number = 0) => {
    const isFirst = index === 0;
    const isLast = index === last;

    const rowStyles = rowStylesBase.slice();

    if (!transparent && !isLast) {
      rowStyles.push("border-bottom:none");
    }

    const rowStyle = rowStyles.length ? ` style="${rowStyles.join(";")}"` : "";

    const imageWidthDiff =
      itemImageWidth && imageWidth
        ? Math.max(itemImageWidth - imageWidth, 0)
        : 0;

    const paddingOuter = transparent ? 0 : paddingHorizontal;
    const paddingInner = imageWidth
      ? paddingHorizontalInner
      : paddingHorizontalOuter;

    if (variant === "bullet") {
      return {
        colPadding: padding([0, paddingOuter, 0, paddingInner]),
        colSpan: textColSpan,
        rowStyle,
      };
    }

    const paddingTop = transparent
      ? 0
      : isFirst
      ? paddingVertical
      : childVerticalPadding;

    const paddingBottom = transparent
      ? isLast
        ? 0
        : childVerticalPadding
      : isLast
      ? paddingVertical
      : 0;

    const imageColPadding = padding([
      paddingTop,
      paddingInner,
      paddingBottom,
      paddingOuter + imageWidthDiff,
    ]);

    const textColPadding = padding([
      paddingTop,
      paddingOuter,
      paddingBottom,
      paddingInner,
    ]);

    const textColWidth =
      tableWidth -
      2 * paddingOuter -
      (imageWidth ? imageWidth + imageWidthDiff + 2 * paddingInner : 0);

    return {
      imageColPadding,
      imageWidth,
      rowStyle,
      textColPadding,
      textColSpan,
      textColWidth,
    };
  };
};

const getListStyleHandlers = (
  config: IListBlockConfig
): IHtmlImageListStyles => {
  const { background = "transparent", imagePath } = config.top;

  const imageWidth = imagePath ? imageSizeToWidth.small : 0;
  const transparentBackground = background === "transparent";

  const borderWidth = transparentBackground ? 0 : 1;
  const paddingHorizontalOuter = transparentBackground ? 0 : paddingHorizontal;
  const paddingInner = imageWidth
    ? paddingHorizontalInner
    : paddingHorizontalOuter;
  const colPaddingVertical = transparentBackground ? 0 : paddingVertical;
  const imageColPadding = padding([
    colPaddingVertical,
    paddingInner,
    colPaddingVertical,
    paddingHorizontalOuter,
  ]);
  const textColPadding = padding([
    colPaddingVertical,
    paddingHorizontalOuter,
    colPaddingVertical,
    paddingInner,
  ]);

  const tableWidth = emailWidth - 2 * sectionPadding - 2 * borderWidth;
  const textColWidth =
    tableWidth -
    2 * paddingHorizontalOuter -
    (imageWidth ? imageWidth + 2 * paddingInner : 0);
  const textColSpan =
    config.child && config.child.imagePath && !imagePath ? 2 : 1;

  const colorName = colors.colorNames[background];
  const backgroundColor = colors.backgrounds[colorName];
  const borderColor = colors.borders[colorName];

  const baseRowStyles = !transparentBackground
    ? [
        `background:${backgroundColor}`,
        `border:${borderWidth}px solid ${borderColor}`,
      ]
    : [];

  const itemStyleHandler = (
    index: number,
    _: number,
    hasChildren: boolean
  ): IHtmlImageListTopStyles => {
    const isFirst = index === 0;

    const itemStyle = isFirst || hasChildren ? "" : ' padding="0px"';
    const rowStyles = baseRowStyles.slice();

    const rowStyle = rowStyles.length ? ` style="${rowStyles.join(";")}"` : "";

    return {
      imageColPadding,
      imageWidth,
      itemStyle,
      rowStyle,
      textColPadding,
      textColSpan,
      textColWidth,
    };
  };

  const itemChildStyleHandler = getListChildStyleHandler(
    config,
    imageWidth,
    tableWidth,
    paddingHorizontalOuter
  );

  return {
    item: itemStyleHandler,
    itemChild: itemChildStyleHandler,
  };
};

export default getListStyleHandlers;
