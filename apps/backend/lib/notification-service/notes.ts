import { ValueJSON } from "slate";
import Plain from "slate-plain-serializer";

import * as dynamo from "../dynamo";
import getTableName, { TABLE_NAMES } from "../dynamo/tablenames";
import notes, { INotes } from "../notes";
import { get as getNotification } from "./";

const empty = Plain.deserialize("", {
  defaultBlock: { type: "paragraph" },
}).toJSON();

export default (tenantId: string, userId: string) => {
  // remove the pointer on the notification item and
  // delete the file from s3
  const del = async (id: string) => {
    await dynamo.update({
      Key: { id, tenantId },
      TableName: getTableName(TABLE_NAMES.OBJECTS_TABLE_NAME),
      UpdateExpression: "REMOVE notes",
    });
    await notes(tenantId, userId).del(`notification/${id}`);
  };

  // get the note file from S3
  const get = async (id: string) => {
    const notification = await getNotification({ tenantId, id });
    try {
      return await notes(tenantId, userId).get(
        `notification/${notification.id}`
      );
    } catch (err) {
      if (err?.statusCode === 404) {
        return {
          html: "",
          markdown: "",
          slate: null,
          updated: null,
          updater: null,
        } as INotes;
      }
      throw err;
    }
  };

  // put the notes file and update the pointer on the notification item
  const put = async (id: string, slate: ValueJSON) => {
    const pointer = await notes(tenantId, userId).put(
      `notification/${id}`,
      slate
    );

    await dynamo.update({
      ConditionExpression: "attribute_exists(id)",
      ExpressionAttributeNames: { "#notes": "notes" },
      ExpressionAttributeValues: pointer ? { ":notes": pointer } : undefined,
      Key: { id, tenantId },
      TableName: getTableName(TABLE_NAMES.OBJECTS_TABLE_NAME),
      UpdateExpression: pointer ? "SET #notes = :notes" : "REMOVE #notes",
    });
  };

  return {
    del,
    get,
    put,
  };
};
