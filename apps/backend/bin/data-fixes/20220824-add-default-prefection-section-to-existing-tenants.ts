import logger from "~/lib/logger";
import { addDefaultsForPreferences } from "~/lib/preferences/add-defaults";
import { Handler, IDataFixEvent } from "./types";

interface IEvent extends IDataFixEvent {
  tenantId: string;
}

/*
  In order to execute this lambda, you need to execute `BinInvokeForTenants` lambda with the following payload:
  {
    "lambdaFn": "BinDataFix",
    "filename": "20220824-add-default-prefection-sections",
  }
*/

const handler: Handler<IEvent> = async (event) => {
  const { tenantId } = event;
  try {
    await Promise.all([
      addDefaultsForPreferences(tenantId),
      addDefaultsForPreferences(`${tenantId}/test`),
    ]);
  } catch (error) {
    logger.error(
      `Failed to add default preferences for workspace ${tenantId}`,
      error
    );
  }
};

export default handler;
