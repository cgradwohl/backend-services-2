import {
  TransactWriteItem,
  TransactWriteItemsInput,
} from "aws-sdk/clients/dynamodb";

export interface ICreateFn {
  (...queries: TransactWriteItem[]): TransactWriteItemsInput;
}

export interface IWriteFn {
  (transaction: TransactWriteItemsInput): Promise<void>;
}
