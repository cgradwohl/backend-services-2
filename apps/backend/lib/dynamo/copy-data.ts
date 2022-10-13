import logger from "~/lib/logger";
import { scan, put } from "./index";

const copyData = async (from: string, to: string) => {
  while (true) {
    const res = await scan({ TableName: from });

    logger.debug(`Writing ${res.Items.length} items...`);
    for (const item of res.Items) {
      await put({
        TableName: to,
        Item: item,
      });
    }
    logger.debug("...done.");

    if (res.LastEvaluatedKey === undefined) {
      logger.debug("No additional records found.");
      break;
    } else {
      logger.debug("Scanning for additional records...");
    }
  }
};

export default copyData;
