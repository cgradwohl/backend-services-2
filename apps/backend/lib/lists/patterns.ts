import { DocumentClient } from "aws-sdk/clients/dynamodb";
import * as dynamodb from "~/lib/dynamo";
import getIdPatterns from "~/lib/get-id-patterns";
import { CourierObject } from "~/types.api";
import getTableName, { TABLE_NAMES } from "../dynamo/tablenames";
import { assertValidPattern } from "./index";
import { listItemStore, patternStore } from "./stores";
import { IListItems } from "./types";

const objtype = "list:pattern";

/*
  specific batchGet for lists responsible for returning an array of list ids
  that can be used to batchGet all lists associated with a specific
  pattern / segment search parameter
*/
export const findByPattern = async (
  tenantId: string,
  pattern: string,
  options?: { exclusiveStartKey?: DocumentClient.Key }
): Promise<IListItems> => {
  if (!pattern) {
    return {
      items: [],
      lastEvaluatedKey: null,
    };
  }

  assertValidPattern(pattern);

  const matchingPatterns = await dynamodb.query({
    ExclusiveStartKey: options?.exclusiveStartKey,
    ExpressionAttributeNames: {
      "#archived": "archived",
      "#id": "id",
      "#tenantId": "tenantId",
    },
    ExpressionAttributeValues: {
      ":id": `list:pattern/${pattern}/`,
      ":tenantId": tenantId,
      ":true": true,
    },
    FilterExpression: "#archived <> :true",
    KeyConditionExpression: "#tenantId = :tenantId AND begins_with(#id, :id)",
    Limit: 25,
    TableName: getTableName(TABLE_NAMES.OBJECTS_TABLE_NAME),
  });

  const response = await listItemStore.batchGet({
    configurationIds: matchingPatterns.Items.map((item) => item?.json?.refId),
    tenantId,
  });

  return {
    items: response,
    lastEvaluatedKey: matchingPatterns.LastEvaluatedKey,
  };
};

/*
  iterates across an array of supported id patterns that are batch created
  in up to 25 id patterns at a time
*/
export const createPatterns = async (
  tenantId: string,
  userId: string,
  listItemId: string
) => {
  const patterns = getIdPatterns(listItemId);
  const timestamp = Date.now();
  const user = userId ?? `tenant/${tenantId}`;

  await patternStore.batchCreate(
    { tenantId, userId },
    patterns.map(
      (pattern): CourierObject => ({
        created: timestamp,
        creator: user,
        id: `list:pattern/${pattern}/${listItemId}`,
        json: {
          pattern,
          refId: listItemId,
          refType: "list",
        },
        objtype,
        tenantId,
        title: undefined,
        updated: timestamp,
        updater: user,
      })
    )
  );
};
