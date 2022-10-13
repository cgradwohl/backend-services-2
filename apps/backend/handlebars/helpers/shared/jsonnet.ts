import { HelperOptions } from "handlebars";

import jsonbars from "~/lib/jsonnet/jsonbars";
import Jsonnet from "~/lib/jsonnet";
import jsonnetHelpers from "~/lib/jsonnet/helpers";

const jsonnet = new Jsonnet();

import assertHandlebarsArguments from "../utils/assert-arguments";
import getHandlebarsData from "../utils/get-data";
import getHandlebarsVariableHandler from "../utils/get-variable-handler";
import defaultWebhookJsonnetTemplate from "~/handlebars/partials/webhook/default-jsonnet-template";

function jsonnetHandlebarsHelper(...args) {
  const [options] = assertHandlebarsArguments<[HelperOptions]>(args);
  let { template } = options.hash;
  const { variant } = options.hash;

  const data = getHandlebarsData(options);
  const { blockHandler } = data;
  const variableHandler = getHandlebarsVariableHandler(options);
  const context = variableHandler.getRootValue();

  let block: object;

  if (variant === "webhook" && !template) {
    template = defaultWebhookJsonnetTemplate;
  }

  const request = {
    brand: context.brand?.id,
    data: context.data,
    event: context.event,
    message: context.messageId,
    profile: context.profile,
    recipient: context.recipient,
    template: context.template,
  };

  const code = `
      ${jsonnetHelpers(context.data, context.profile)}
      local brand = "${context.brand?.id}";
      local message = "${context.messageId}";
      local recipient = "${context.recipient}";
      local event = "${context.event}";
      local template = "${context.template}";
      local _request = ${JSON.stringify(request)};
      local request(path="", defaultValue=null) =
          nestedFieldFromArray(_request, std.split(path, '.'), defaultValue);
      ${template}`;

  // TODO remove after expel stops using this helper
  if (code.includes("{{#slackifyMd}}")) {
    block = jsonbars({
      snippet: code,
      data: context.data,
      variableHandler,
    });
  } else {
    block = jsonnet.eval(code);
  }

  blockHandler(block);

  return "";
}

export default jsonnetHandlebarsHelper;
