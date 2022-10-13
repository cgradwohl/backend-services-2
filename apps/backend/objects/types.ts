import { CourierObject } from "~/types.api";

export interface IMaterializedObjectsService {
  save: (object: CourierObject) => Promise<void>;
  shouldMaterializeObject: (objtype: string) => boolean;
  get: <T = any>(
    id: string,
    options?: { latest?: boolean }
  ) => Promise<CourierObject<T>>;
}
