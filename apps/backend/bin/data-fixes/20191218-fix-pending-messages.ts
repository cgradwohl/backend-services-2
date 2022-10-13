import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import { update } from "../../lib/dynamo";
import { get as getMessage } from "../../lib/dynamo/messages";

/*
  invoke with an array of message ids to update `ENQUEUED` => `ERROR` status:
    $ yarn serverless:invoke-local
        -f BinFixPendingMessages
        -d {
            "tenant-id-123": ["123", "456"],
            "tenant-id-456": ["098", 765]
        }
*/

const messagesV2TableName = getTableName(TABLE_NAMES.MESSAGES_TABLE_NAME);

const updateStatus = async (message: any) => {
  const { id, status, tenantId } = message;

  if (status === "ERROR") {
    console.log(` >> ${id}: message already has a status of ERROR.`);
    return;
  }

  if (status !== "ENQUEUED") {
    console.log(` >> ${id}: message status !== ENQUEUED, ABORT.`);
    return;
  }

  console.log(` >> ${id}: message updating...`);

  await update({
    TableName: messagesV2TableName,
    Key: {
      id,
      tenantId,
    },
    UpdateExpression: "set messageStatus = :status",
    ExpressionAttributeValues: {
      ":status": "ERROR",
    },
    ReturnValues: "NONE",
  });

  console.log(` >> ${id}: message updated successfully.`);
};

type Data = {
  messagesIds: Array<string>;
};

export const handle = async (data: Data) => {
  const tenantIds = Object.keys(data);

  for (const tenantId of tenantIds) {
    const messageIds = data[tenantId];
    console.log(
      `\nprocessing ${messageIds.length} messages for tenant ${tenantId}...`
    );

    for (const messageId of messageIds) {
      const message: any = await getMessage(tenantId, messageId);
      if (message) {
        message.id = messageId;
        message.tenantId = tenantId;
        console.log(`\n${message.id} processing...`);
        await updateStatus(message);
      } else {
        console.log(`\n${messageId} not found, skipping.`);
      }
    }
  }

  console.log("\nfix-pending-messages is complete!\n");
};
