import * as dynamodb from "..";
import { ICreateFn, IWriteFn } from "./types";

export const create: ICreateFn = (...queries) => ({
  TransactItems: queries,
});

export const write: IWriteFn = async transaction => {
  await dynamodb.transactWrite(transaction);
};
