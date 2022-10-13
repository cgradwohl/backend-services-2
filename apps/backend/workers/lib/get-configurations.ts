import {
  batchGet as batchGetConfigurations,
  get,
} from "~/lib/configurations-service";
import { getFeatureTenantVariation } from "~/lib/get-launch-darkly-flag";
import materializedObjectService from "~/objects/services/materialized-objects";
import { CourierObject, IConfigurationJson } from "~/types.api";

type GetConfigurations = (
  tenantId: string,
  configurationIds: string[]
) => Promise<Array<CourierObject<IConfigurationJson>>>;

const getConfigurations: GetConfigurations = async (
  tenantId: string,
  configurationIds: string[]
) => {
  const enableMaterializedObjects = await getFeatureTenantVariation(
    "enable-materialized-objects",
    tenantId
  );
  if (!enableMaterializedObjects) {
    return batchGetConfigurations({
      configurationIds,
      tenantId,
    });
  }

  const materializedObjects = materializedObjectService(tenantId);

  return Promise.all(
    configurationIds.map(async (id: string) => {
      const configuration = await materializedObjects.get<IConfigurationJson>(
        id
      );
      if (!configuration || !configuration.objtype) {
        return get({ id, tenantId });
      }
      return configuration;
    })
  );
};

export default getConfigurations;
