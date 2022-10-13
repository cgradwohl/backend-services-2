import { HelperOptions } from "handlebars";

import assertHandlebarsArguments from "../utils/assert-arguments";

const emailWidth = 580;
const iconMargin = 4;
const iconWidth = 18;
const paddingHorizontal = 20;
const paddingVertical = 10;
const sectionPadding = 10;

export const supportedEmailFooterLinks = [
  "facebook",
  "instagram",
  "linkedin",
  "medium",
  "twitter",
];

function courierEmailFooterHandlebarsHelper(...args) {
  const [options, links] = assertHandlebarsArguments<[HelperOptions, string[]]>(
    args,
    "footerLinks"
  );
  const icons = links
    ? supportedEmailFooterLinks.filter((icon) => icon in links)
    : [];
  const iconColumnWidth =
    icons.length * (iconMargin + iconWidth + iconMargin) + paddingHorizontal; // padding only on right
  const textColumnWidth =
    emailWidth - sectionPadding - sectionPadding - iconColumnWidth;

  const data = {
    ...options.data,
    emailWidth,
    iconColumnWidth,
    iconMargin,
    iconWidth,
    icons: icons.length ? icons : undefined,
    paddingHorizontal,
    paddingVertical,
    sectionPadding,
    textColumnWidth,
  };

  return options.fn(this, { data });
}

export default courierEmailFooterHandlebarsHelper;
