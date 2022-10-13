import { match } from "typescript-pattern-matching";
import { toApiKey } from "~/lib/api-key-uuid";
import dynamoObjectService from "~/lib/dynamo/object-service";
import { list as listNotifications } from "~/lib/notification-service";
import extractConfigurations from "~/lib/notifications/extract-configurations";
import upgradeNotification from "~/lib/notifications/upgrade";

import { CourierObject, IConfigurationJson } from "../../types.api";
import getTenantInfo from "../get-tenant-info";
import {
  isPersonalizedWelcomeConfiguration,
  personalizedWelcomeConfiguration,
  personalizedWelcomeConfigurationId,
} from "../notifications/personalized-welcome";
import {
  isQuickstartConfiguration,
  quickstartConfiguration,
  quickstartConfigurationId,
} from "../notifications/quickstart";
import { Arg, DeleteFn, Env, GetConfigurationByEnvFn } from "./types";

const objtype = "configuration";

const configuration = dynamoObjectService<IConfigurationJson>(objtype);

export const hasConfiguration =
  (id: string, env: Env = "production") =>
  async (notification: Arg): Promise<boolean> =>
    match<Arg["json"], Promise<boolean>>(notification.json)
      // Upgrade the legacy notification and try again
      .with({ strategyId: String }, async (x) =>
        hasConfiguration(id)(
          await upgradeNotification({ ...notification, json: x })
        )
      )
      .with(
        {
          channels: { always: [{ id: String }], bestOf: [{ id: String }] },
        },
        (x) => extractConfigurations({ ...notification, json: x }).includes(id)
      )
      .otherwise(() => {
        throw new Error("Unknown version of Notification");
      })
      .run();

export const archive: DeleteFn = async (tenantId, id, userId) => {
  const { objects } = await listNotifications({ archived: false, tenantId });
  // Async await does not work Array.prototype.filter. Had to generated mapped results
  // and then do a lookup to filter down.
  const mappedResults = await Promise.all(
    objects.map(async (n) => hasConfiguration(id)(n))
  );
  const notificationsWithConfiguration = objects.filter(
    (_, i) => mappedResults[i]
  );

  if (!notificationsWithConfiguration.length) {
    await configuration.archive({ id, tenantId, userId });

    return {
      status: "ok",
    };
  }

  const notifications = notificationsWithConfiguration.map(
    ({ id: notificationId, title }) => ({
      id: toApiKey(notificationId),
      title,
    })
  );

  return {
    notifications,
    status: "error",
  };
};

type BatchFn = typeof configuration.batchGet;
export const batchGet: BatchFn = async (params) => {
  const { tenantId, environment } = getTenantInfo(params.tenantId);

  if (isQuickstartConfiguration(params.configurationIds)) {
    return [quickstartConfiguration(tenantId)];
  }

  if (isPersonalizedWelcomeConfiguration(params.configurationIds)) {
    return [personalizedWelcomeConfiguration(tenantId)];
  }

  const fullConfigurations = await configuration.batchGet({
    configurationIds: params.configurationIds,
    tenantId,
  });

  return environment === "production"
    ? fullConfigurations
    : fullConfigurations.map((config) =>
        getConfigurationByEnv(config, environment)
      );
};
export const create = configuration.create;

type GetFn = typeof configuration.get;
export const get: GetFn = async (params) => {
  const { tenantId, environment } = getTenantInfo(params.tenantId);

  if (params.id === quickstartConfigurationId) {
    return quickstartConfiguration(tenantId);
  }

  if (params.id === personalizedWelcomeConfigurationId) {
    return personalizedWelcomeConfiguration(tenantId);
  }

  const fullConfiguration = await configuration.get({
    id: params.id,
    tenantId,
  });

  return environment === "production"
    ? fullConfiguration
    : getConfigurationByEnv(fullConfiguration, environment);
};

export const getConfigurationByEnv: GetConfigurationByEnvFn = (
  configuration,
  env
) => {
  const config = configuration.json[env];

  return !config
    ? configuration
    : {
        ...configuration,
        json: { ...config, provider: configuration.json.provider },
        title: `${env} - ${configuration.title}`,
      };
};

export const list = configuration.list;
export const replace = configuration.replace;

export const getByProvider = async (tenantId: string, provider: string) => {
  // remove env suffix if any
  // because configurations are stored by tenantId without the env suffix
  const { objects } = await configuration.list({
    tenantId: tenantId.split("/")[0],
  });

  // in the future we could have > 1 integrations per provider...
  // this will cause an issue here
  return objects.find((object) => {
    return object?.json?.provider === provider;
  });
};

export const listProviders = async (
  tenantId: string
): Promise<Array<CourierObject<IConfigurationJson>>> => {
  const isTest = tenantId.includes("/test");

  // NOTE: the legacy object service (listConfigurations) does not support scoped tenantIds
  // ...all configurations are stored under an un scoped tenantId in the objects table
  const { objects } = await list({
    tenantId: tenantId.replace("/test", ""),
  });

  if (isTest) {
    return objects.map((config) => {
      const { test, ...restConfig } = config?.json;

      // if we have a test scoped tenantId
      // then return test scoped provider configs
      // otherwise fallback to the default provider config
      return {
        ...config,
        json: {
          ...restConfig,
          ...test,
        },
      };
    });
  }

  return objects;
};
