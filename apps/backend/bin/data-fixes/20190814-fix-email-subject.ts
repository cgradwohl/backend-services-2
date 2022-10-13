import { Value } from "slate";
import Plain from "slate-plain-serializer";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import { scan, update } from "../../lib/dynamo";

export const handle = async (event: any = {}) => {
  const TableName = getTableName(TABLE_NAMES.OBJECTS_TABLE_NAME);
  const res = await scan({ TableName });

  for (const item of res.Items) {
    if (item.objtype !== "event") {
      continue;
    }

    const newProviders = {};
    const subjectBlocks = Object.keys(item.json.providers)
      .map((providerKey) => {
        newProviders[providerKey] = newProviders[providerKey] || {};

        const provider = item.json.providers[providerKey];
        if (provider.subject) {
          delete provider.subject;
        }

        newProviders[providerKey] = provider;
        return provider.subject && provider.subject[0];
      })
      .filter((v) => v);

    item.json.providers = newProviders;

    if (!subjectBlocks.length) {
      // must not have email configured
      continue;
    }

    if (subjectBlocks.length > 1) {
      console.log("found > 1 subject, manually fix", item);
      continue;
    }

    let subjectValue;
    item.json.blocks = item.json.blocks.filter((block) => {
      if (block.id !== subjectBlocks[0]) {
        return true;
      }

      subjectValue = JSON.parse(block.value);
      return false;
    });

    item.json.emailSubject =
      item.json.emailSubject ||
      Plain.serialize(Value.fromJSON(subjectValue) as any);

    await update({
      TableName,
      Key: {
        id: item.id,
        tenantId: item.tenantId,
      },
      UpdateExpression: "set json = :json",
      ExpressionAttributeValues: {
        ":json": item.json,
      },
      ReturnValues: "ALL_NEW",
    });
  }
};
