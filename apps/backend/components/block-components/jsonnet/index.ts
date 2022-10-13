import { ITemplateBlockConfig } from "~/types.api";
import { error } from "~/lib/log";

// code taken from: https://github.com/databricks/sjsonnet/releases/download/0.2.4/sjsonnet.js
import Jsonnet from "~/lib/jsonnet";
// instance jsonnet
const jsonnet = new Jsonnet();

// nestedFieldFromArray inspired from: https://groups.google.com/forum/#!topic/jsonnet/-W7BX3dtNIc
declare global {
  var SjsonnetMain: {
    interpret: (
      jsonnet: string,
      externalVars: object,
      topLevelVars: object,
      initialWorkingDir?: string,
      fileResolver?: (cwd: string, path: string) => [string, string]
    ) => object;
  };
}

export default (block, serializerType): object | undefined => {
  if (serializerType !== "slack") {
    return;
  }

  const { scope: variables, config: blockConfig } = block;
  const { template } = blockConfig as ITemplateBlockConfig;
  const context = variables.getRootValue();

  try {
    const code = `        
        local recipient = ${JSON.stringify(context.recipient)};
        local event = ${JSON.stringify(context.event)};
        local _data = ${JSON.stringify(context.data)};
        local _profile = ${JSON.stringify(context.profile)};
        local nestedFieldFromArray(obj, arr, defaultValue=null) = (
            if std.length(arr) == 0 then
                defaultValue
            else 
              if std.isArray(obj) then 
                if std.length(arr) == 1 then obj[std.parseInt(arr[0])]
                else nestedFieldFromArray(obj[std.parseInt(arr[0])], arr[1:], defaultValue)
              else
                if std.isObject(obj) && std.objectHas(obj, arr[0]) then
                  if std.length(arr) == 1 then obj[arr[0]]
                    else nestedFieldFromArray(obj[arr[0]], arr[1:], defaultValue)
                else 
                    defaultValue
        );      
        local data(path="", defaultValue=null) = 
            nestedFieldFromArray(_data, std.split(path, '.'), defaultValue);
        local profile(path="", defaultValue=null) = 
            nestedFieldFromArray(_profile, std.split(path, '.'), defaultValue);
        local chunk(str="", chunkSize=40) =
          local myStrLen = std.length(str);
          local rangeList = [(i*chunkSize) for i in std.range(0,  std.ceil(myStrLen/chunkSize) - 1)];
          [(str[i:i+chunkSize]) for i in rangeList];     
        ${template}`;

    return jsonnet.eval(code);
  } catch (ex) {
    error("ex", ex);
    return {
      text: {
        text: String(ex).replace("Error: ", "").replace("\n", ""),
        type: "mrkdwn",
      },
      type: "section",
    };
  }
};
