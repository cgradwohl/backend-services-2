import { SafeString } from "handlebars";

const textStyles = {
  h1: 'color="#4C4C4C" font-size="24px" font-weight="600" line-height="28px"',
  h2: 'color="#5a6c84" font-size="18px" font-weight="600" line-height="22px"',
  subtext: 'color="#8F8F8F" font-size="11px" line-height="15px"',
  text: 'color="#4C4C4C" font-size="14px" line-height="18px"',
  quote:
    'color="#696969" font-size="14px" line-height="18px" font-style="italic"',
};

/**
 * usage: <h1 style="{{courier-email-text-style "h1"}}">
 *
 * should:
 *   - only be used within an HTML style property
 *   - return the text styles for the specified element
 *   - return a null string if the element was not found
 */
function courierEmailTextStyleHandlebarsHelper(textStyle: any = "text") {
  const style = textStyles[textStyle];
  return style ? new SafeString(style) : "";
}

export default courierEmailTextStyleHandlebarsHelper;
