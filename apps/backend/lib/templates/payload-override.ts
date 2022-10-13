import Jsonnet from "~/lib/jsonnet";
import helpers from "~/lib/jsonnet/helpers";
import { IRenderedTemplatesMap } from "~/handlebars/template/render-templates";

// instance jsonnet
const jsonnet = new Jsonnet();

export default ({
  payloadOverrideTemplate,
  templates,
  variableHandler,
}): IRenderedTemplatesMap => {
  const context = variableHandler.getRootValue();
  const code = `       
      ${helpers(context.data, context.profile)} 
      local _template = ${JSON.stringify(templates)};
      local template(path="", defaultValue=null) = 
          nestedFieldFromArray(_template, std.split(path, '.'), defaultValue);
      ${payloadOverrideTemplate}`;

  return jsonnet.eval(code);
};
