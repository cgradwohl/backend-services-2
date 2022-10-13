import { Context } from "aws-lambda";

export interface IDataFixEvent {
  filename: string;
}

export type Handler<T extends IDataFixEvent = IDataFixEvent> = (
  event: T,
  context: Context
) => Promise<void>;
