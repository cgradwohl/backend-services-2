import * as configurations from "~/lib/configurations-service";
import providerList from "~/providers";

import { IResolver } from "../types";

const providers: IResolver<{ fields: Array<{ [key: string]: any }> }> = async (
  source,
  _,
  context
) => {
  const { tenantId } = context;
  const { objects } = await configurations.list({ tenantId });

  const profile = source.fields.reduce((acc, field) => {
    return {
      ...acc,
      [field.key]: field.value,
    };
  }, {});

  return objects.map((object) => {
    const provider = providerList[object.json.provider];
    const config = {
      created: null,
      creator: null,
      id: null,
      json: { provider: object.json.provider },
      objtype: null,
      tenantId,
      title: null,
    };

    return {
      installed: provider.handles({ config, profile }),
      provider: object.json.provider,
    };
  });
};

export default {
  Profile: {
    providers,
  },
};
