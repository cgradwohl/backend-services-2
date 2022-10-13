import assertIsDefined from "~/lib/assertions/is-defined";
import dataFixes from "./";
import { Handler } from "./types";

const handler: Handler = async (event, context) => {
  const filename = event?.filename;
  assertIsDefined(filename);

  const dataFix = dataFixes[filename];
  assertIsDefined(dataFix);

  await dataFix(event, context);
};

export default handler;
