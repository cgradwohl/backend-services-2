import { ICodeServiceObject } from "../../../types.internal";

export interface ICodeService<T> {
  create: (
    data: T,
    options?: {
      additionalAttributes?: { email?: string };
      transform?: (code: string) => string;
    }
  ) => Promise<ICodeServiceObject<T>>;
  queryByEmail: (email: string) => Promise<Array<ICodeServiceObject<T>>>;
  get: (code: string) => Promise<ICodeServiceObject<T>>;
  remove: (code: string) => Promise<{}>;
  queryBeginsWith: (
    beginsWith: string
  ) => Promise<Array<ICodeServiceObject<T>>>;
}
