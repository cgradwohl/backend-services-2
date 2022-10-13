import { IChannel, INotificationWire } from "~/types.api";

export type ApplyFn<T> = (property: T, ctx: IContext) => void;
export interface IApply {
  channels?: ApplyFn<IChannel[]>;
}
interface IContext {
  [key: string]: any;
  tenantId: string;
}
type VisitFn<T> = (
  notification: INotificationWire,
  apply: T extends INotificationWire ? IApply : ApplyFn<T>,
  ctx: IContext
) => void;

const visit: VisitFn<INotificationWire> = (notification, apply, ctx) => {
  if (apply.channels) {
    visitConfigurations(notification, apply.channels, ctx);
  }
};

const visitConfigurations: VisitFn<IChannel[]> = (notification, apply, ctx) => {
  const {
    json: {
      channels: { always, bestOf },
    },
  } = notification;

  apply(always, ctx);
  apply(bestOf, ctx);
};

export default visit;
