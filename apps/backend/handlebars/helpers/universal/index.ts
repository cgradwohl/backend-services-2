import andHandlebarsHelper from "./and";
import arrayHandlebarsHelpers from "./array";
import capitalizeHandlebarsHelper from "./capitalize";
import concatHandlebarsHelper from "./concat";
import conditionHandlebarsHelper from "./condition";
import conditionalHandlebarsHelper from "./conditional";
import courierBlockHandlebarsHelper from "./courier-block";
import courierPartialHandlebarsHelper from "./courier-partial";
import defaultHandlebarsHelper from "./default";
import eachHandlebarsHelper from "./each";
import filterHandlebarsHelper from "./filter";
import formatHandlebarsHelper from "./format";
import getHrefHandlebarsHelper from "./get-href";
import getListItemsHandlebarsHelper from "./get-list-items";
import incHandlebarsHelper from "./inc";
import inlineVarHandlebarsHelper from "./inline-var";
import jsonParseHandlebarsHelper from "./json-parse";
import linkContextHandlebarsHelper from "./link-context";
import lineBreakHandlebarsHelper from "./line-break";
import mathHandlebarsHelpers from "./math";
import orHandlebarsHelper from "./or";
import paramsHandlebarsHelper from "./params";
import parseStringHandlebarsHelper from "./parse-string";
import partialBlockIndentFix from "./partial-block-indent-fix";
import pathHandlebarsHelper from "./path";
import prerenderHandlebarsHelper from "./prerender";
import replaceAllHandlebarsHelper from "./replace-all";
import setHandlebarsHelper from "./set";
import stringHandlebarsHelpers from "./string";
import textDirectionHelper from "./text-direction";
import trimHandlebarsHelper from "./trim";
import trimLeftHandlebarsHelper from "./trim-left";
import trimOneCharRightHandlebarsHelper from "./trim-one-char-right";
import trimRightHandlebarsHelper from "./trim-right";
import truncateHandlebarsHelper from "./truncate";
import varHandlebarsHelper from "./var";
import withHandlebarsHelper from "./with";

import swuDateTimeFormatHelper from "./sendwithus/date-time-format";
import swuISO8601ToTimeHelper from "./sendwithus/iso8601-to-time";
import swuTimestampToTimeHelper from "./sendwithus/timestamp-to-time";

/**
 * generic helpers that can be used by all render methods (email, slack, etc.)
 */
const universalHandlebarsHelpers = {
  and: andHandlebarsHelper,
  capitalize: capitalizeHandlebarsHelper,
  concat: concatHandlebarsHelper,
  condition: conditionHandlebarsHelper,
  conditional: conditionalHandlebarsHelper,
  "courier-block": courierBlockHandlebarsHelper,
  "courier-partial": courierPartialHandlebarsHelper,
  default: defaultHandlebarsHelper,
  each: eachHandlebarsHelper,
  filter: filterHandlebarsHelper,
  format: formatHandlebarsHelper,
  "get-href": getHrefHandlebarsHelper,
  "get-list-items": getListItemsHandlebarsHelper,
  inc: incHandlebarsHelper,
  "inline-var": inlineVarHandlebarsHelper,
  "json-parse": jsonParseHandlebarsHelper,
  "link-context": linkContextHandlebarsHelper,
  "line-break": lineBreakHandlebarsHelper,
  or: orHandlebarsHelper,
  params: paramsHandlebarsHelper,
  "parse-string": parseStringHandlebarsHelper,
  "partial-block-indent-fix": partialBlockIndentFix,
  path: pathHandlebarsHelper,
  prerender: prerenderHandlebarsHelper,
  "replace-all": replaceAllHandlebarsHelper,
  set: setHandlebarsHelper,

  // SendWithUs helpers to ease migration (intentionally use _)
  swu_datetimeformat: swuDateTimeFormatHelper,
  swu_iso8601_to_time: swuISO8601ToTimeHelper,
  swu_timestamp_to_time: swuTimestampToTimeHelper,
  "text-direction": textDirectionHelper,
  trim: trimHandlebarsHelper,
  "trim-left": trimLeftHandlebarsHelper,
  "trim-one-char-right": trimOneCharRightHandlebarsHelper,
  "trim-right": trimRightHandlebarsHelper,
  truncate: truncateHandlebarsHelper,
  var: varHandlebarsHelper,
  with: withHandlebarsHelper,

  ...arrayHandlebarsHelpers,
  ...mathHandlebarsHelpers,
  ...stringHandlebarsHelpers,
};

export default universalHandlebarsHelpers;
