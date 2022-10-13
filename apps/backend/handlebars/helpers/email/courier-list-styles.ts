import { HelperOptions } from "handlebars";

import * as colors from "../utils/colors";
import {
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

function courierListStylesHandlebarsHelper(this: any, options: HelperOptions) {
  const data = getHandlebarsData(options);

  // get values from data
  const background: string | undefined = data.background;
  const hasChildImages: boolean = data.hasChildImages;
  const imagePath: string = data.imagePath;
  const hasChildren: boolean = data.hasChildren;

  const hasImages = Boolean(imagePath && imagePath.trim());
  const imageWidth = hasImages ? imageSizeToWidth.small : 0;
  const transparentBackground = !background || background === "transparent";

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
  const textColSpan = !hasImages && hasChildren && hasChildImages ? 2 : 1;

  const colorName = colors.colorNames[background];
  const backgroundColor = colors.backgrounds[colorName];
  const borderColor = colors.borders[colorName];

  const rowStyle = !transparentBackground
    ? `background:${backgroundColor};border:${borderWidth}px solid ${borderColor}`
    : "";

  const childPadding =
    data.childVariant === "bullets"
      ? `0px ${paddingHorizontalOuter}px 0px 0px`
      : "";

  return options.fn(this, {
    data: {
      ...data,
      childPadding,
      imageColPadding,
      imageWidth,
      rowStyle,
      textColPadding,
      textColSpan,
      textColWidth,
    },
  });
}

export default courierListStylesHandlebarsHelper;
