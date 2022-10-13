import logger from "~/lib/logger";
import { getJson, putJson } from "~/objects/stores/s3/materialized-objects";
import { CourierObject } from "~/types.api";
import { IMaterializedObjectsService } from "../types";

const MATERIALIZE_OBJECTS_ALLOW_LIST = [
  "brand",
  "brand:version",
  "event",
  "configuration",
  "notification-draft",
];

export default (tenantId: string): IMaterializedObjectsService => {
  return {
    save: async (object) => {
      let id;
      switch (object.objtype) {
        case "brand":
          // brand/5784cc53-4770-4a75-9217-33a1944a5818
          // 5784cc53-4770-4a75-9217-33a1944a5818
          id = object.id.split("/")[1];
          break;
        case "brand:version":
          // brand/5784cc53-4770-4a75-9217-33a1944a5818/version/2021-10-14T08:32:09.653Z
          // 5784cc53-4770-4a75-9217-33a1944a5818:version
          id = `${object.id.split("/")[1]}:version`;
          break;
        default:
          id = object.id;
      }

      await putJson(tenantId, id, object);
    },

    shouldMaterializeObject: (objtype: string): boolean => {
      return MATERIALIZE_OBJECTS_ALLOW_LIST.includes(objtype);
    },

    get: async <T>(id: string, options?: { latest?: boolean }) => {
      logger.debug(
        `Looking up materialized store for id ${id} in tenantId ${tenantId} with additional options ${JSON.stringify(
          options,
          null,
          2
        )}`
      );
      if (options?.latest) {
        id = `${id}:version`;
      }
      const json = await getJson(tenantId, id);

      if (!json) {
        return;
      }

      return { ...json } as CourierObject<T>;
    },
  };
};
