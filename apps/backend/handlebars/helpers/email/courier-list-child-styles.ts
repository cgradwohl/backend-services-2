import { HelperOptions } from "handlebars";

import * as colors from "../utils/colors";
import {
  childVerticalPadding,
  emailWidth,
  imageSizeToWidth,
  paddingHorizontal,
  paddingHorizontalInner,
  paddingVertical,
  sectionPadding,
} from "../utils/email-constants";
import getHandlebarsData from "../utils/get-data";

// format an array of numbers for use as a padding style value
const padding = (values: number[]) => values.join("px ") + "px";

function courierListChildStylesHandlebarsHelper(options: HelperOptions) {
  const data = getHandlebarsData(options);

  // get values from data
  const variant: "bullets" | "images" | "numbered" | undefined = data.variant;
  const background: string | undefined = data.background;
  const topHasImages: boolean = data.topHasImages;
  const imagePath: string | undefined = data.imagePath;
  const isFirst: boolean = data.first;
  const isLast: boolean = data.last;

  const transparent = !background || background === "transparent";
  const hasImageOrNumbered = Boolean(imagePath || variant === "numbered");

  const imageWidth = hasImageOrNumbered ? imageSizeToWidth.small : 0;
  const textColSpan = topHasImages && !hasImageOrNumbered ? 2 : 1;
  const borderWidth = transparent ? 0 : 1;
  const tableWidth = emailWidth - 2 * sectionPadding - 2 * borderWidth;
  const paddingHorizontalOuter = transparent ? 0 : paddingHorizontal;

  const colorName = colors.colorNames[background];
  const borderColor = colors.borders[colorName];

  const rowStyles = !transparent
    ? [`border:${borderWidth}px solid ${borderColor}`, "border-top:none"]
    : [];

  if (!transparent && !isLast) {
    rowStyles.push("border-bottom:none");
  }

  const rowStyle = rowStyles.length ? rowStyles.join(";") : "";

  const paddingOuter = transparent ? 0 : paddingHorizontal;
  const paddingInner = imageWidth
    ? paddingHorizontalInner
    : paddingHorizontalOuter;

  if (variant === "bullets") {
    return options.fn(this, {
      data: {
        ...data,
        colPadding: padding([0, paddingOuter, 0, paddingInner]),
        colSpan: textColSpan,
        rowStyle,
      },
    });
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
    paddingOuter,
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
    (imageWidth ? imageWidth + 2 * paddingInner : 0);

  return options.fn(this, {
    data: {
      ...data,
      imageColPadding,
      imageWidth,
      rowStyle,
      textColPadding,
      textColSpan,
      textColWidth,
    },
  });
}

export default courierListChildStylesHandlebarsHelper;
