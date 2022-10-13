import { randomBytes } from "crypto";
import makeError from "make-error";

import * as dynamodb from "..";
import { ICodeServiceObject } from "../../../types.internal";
import getTableName, { TABLE_NAMES } from "../tablenames";
import { ICodeService } from "./types";
import { CourierLogger } from "~/lib/logger";

const { logger } = new CourierLogger("dynamoDbCodeService");

const bigInt36 = BigInt(36);

const generateCode = (length) => {
  let code = "";
  while (code.length < length) {
    // to make this cryptographically not favor any of the 36 characters more than
    // the others, we need to use 9 bytes at a time (lcm(256, 36)) which will give
    // us 64 base36 characters... which is unfortunately larger than Number.MAX_SAFE_INTEGER
    // so... BigInt to the rescue! (Node 10.4+)
    let bigNumber = BigInt(`0x${randomBytes(9).toString("hex")}`);
    // now we can safely generate 64 base36 characters
    const valuesToGenerate = Math.min(length - code.length, 64);
    for (let i = 0; i < valuesToGenerate; i++) {
      const num36 = bigNumber % bigInt36;
      bigNumber = (bigNumber - num36) / bigInt36;
      code += Number(num36).toString(36).toUpperCase();
    }
  }
  return code;
};

const dynamoDbCodeService = <T>(
  objtype: string,
  codeLength: number,
  expiresSeconds: number,
  ttlSeconds: number
): ICodeService<T> => {
  // sanity check
  if (expiresSeconds > ttlSeconds) {
    throw new Error(
      "DynamoDB code service needs a TTL greater than the expires value"
    );
  }

  const TableName = getTableName(TABLE_NAMES.CODES_TABLE_NAME);

  const create: ICodeService<T>["create"] = async (data: T, options) => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const expires = nowSeconds + expiresSeconds;
    const ttl = nowSeconds + ttlSeconds;
    let code = generateCode(codeLength);

    if (options?.transform) {
      code = options.transform(code);
    }

    const item = {
      code,
      data,
      expires,
      objtype,
      ttl,
      ...options?.additionalAttributes,
    };

    await dynamodb.put({
      Item: item,
      TableName,
    });

    return item;
  };

  const get: ICodeService<T>["get"] = async (code: string) => {
    const item = await dynamodb.getItem({
      Key: {
        code,
        objtype,
      },
      TableName,
    });

    if (!item || !item.Item || item.Item.objtype !== objtype) {
      logger.warn("code item not found");
      return;
    }

    return item.Item as ICodeServiceObject<T>;
  };

  const queryBeginsWith: ICodeService<T>["queryBeginsWith"] = async (
    beginsWith: string
  ) => {
    const results = await dynamodb.query({
      ExpressionAttributeValues: {
        ":beginsWith": beginsWith,
        ":objtype": objtype,
      },
      KeyConditionExpression:
        "begins_with(code, :beginsWith) AND objtype = :objtype",
      ScanIndexForward: false,
      TableName,
    });

    if (!results || !results.Items) {
      logger.warn("code results not found");
      return;
    }

    return results.Items as Array<ICodeServiceObject<T>>;
  };

  const remove: ICodeService<T>["remove"] = async (code: string) => {
    await dynamodb.deleteItem({
      Key: {
        code,
        objtype,
      },
      TableName,
    });

    return {};
  };

  const queryByEmail: ICodeService<T>["queryByEmail"] = async (
    email: string
  ) => {
    const { Items } = await dynamodb.query({
      ExpressionAttributeNames: {
        "#email": "email",
        "#objtype": "objtype",
      },
      ExpressionAttributeValues: {
        ":email": email,
        ":objtype": objtype,
      },
      IndexName: "ByEmail",
      KeyConditionExpression: "#objtype = :objtype AND #email = :email",
      TableName,
    });

    if (!Items.length) {
      return [];
    }

    return Items as Array<ICodeServiceObject<T>>;
  };

  return {
    create,
    get,
    queryBeginsWith,
    queryByEmail,
    remove,
  };
};

export default dynamoDbCodeService;
