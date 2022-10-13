import copyData from "../../lib/dynamo/copy-data";

/*
Invoke like so:

yarn serverless:invoke-local -f BinCopyDynamoData -p ./debug.EXAMPLE.json

Expects a file input like:

{
  "from": "messages",
  "to": "messages-v2"
}
*/

export const handle = async (event: any = {}) => {
  const prefix = process.env.PREFIX;
  const { from, to }: { from: string; to: string } = event;

  if (!from || !to || !from.length || !to.length) {
    throw new Error("Unspecified 'from' or 'to'.");
  }

  console.log(`Copying data from '${from}' to '${to}'.`);
  await copyData(`${prefix}-${from}`, `${prefix}-${to}`);
};
