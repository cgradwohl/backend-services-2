import { Handler, IDataFixEvent } from "./types";
import * as configurations from "~/lib/configurations-service";
import { list as listNotifications } from "~/lib/notification-service";
import * as notificationService from "~/lib/notification-service";

interface IEvent extends IDataFixEvent {
  tenantId: string;
  tenantIds: Array<string>;
}

var groupBy = function (xs, key) {
  return xs.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

const handler: Handler<IEvent> = async (event) => {
  console.log("multiple config script started");
  const { tenantId, tenantIds } = event;

  let listOfTenantIds = tenantId ? [tenantId] : tenantIds;

  for (let tenantId of listOfTenantIds) {
    console.log("started tenantId", tenantId);
    const list = await configurations.list({ tenantId });
    const courierConfigs = list.objects
      .filter((obj) => obj.json.provider === "courier")
      .sort((a, b) => (new Date(a.created) > new Date(b.created) ? 1 : -1));
    const oldestConfig = courierConfigs[0];

    console.log("courierConfigs, ", courierConfigs);
    console.log("oldestConfig", oldestConfig.id);

    const { objects } = await listNotifications({ archived: false, tenantId });

    // loop through all courierConfigs
    for (let config of courierConfigs) {
      // loop through all the notifications
      for (let notification of objects) {
        const json = notification.json;
        const always = json.channels.always;
        const bestOf = json.channels.bestOf;

        let configChanged = false;

        // loop through always and set the courier provider to the oldest configuration if found
        for (let each of always) {
          for (let provider of each.providers) {
            if (
              provider.key === "courier" &&
              provider.configurationId !== oldestConfig.id
            ) {
              configChanged = true;
              provider.configurationId = oldestConfig.id;
            }
          }
        }

        // loop through the bestOf and set the courier provider to the oldest configuration if possible
        for (let each of bestOf) {
          for (let provider of each.providers) {
            if (
              provider.key === "courier" &&
              provider.configurationId !== oldestConfig.id
            ) {
              configChanged = true;
              provider.configurationId = oldestConfig.id;
            }
          }
        }

        if (configChanged) {
          const result = await notificationService.replace(
            {
              id: notification.id,
              tenantId,
              userId: "",
            },
            notification
          );
          console.log("notification updated", result);
        }
      } //end notifications loop

      if (config.id !== oldestConfig.id) {
        const deleteResult = await configurations.archive(
          tenantId,
          config.id,
          ""
        );
        console.log("config deleted", deleteResult);
      }
    }
    console.log("ended for tenantId", tenantId);
  }
  console.log("finished");
};

export default handler;
