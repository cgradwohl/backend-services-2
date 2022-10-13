import { addMinutes } from "date-fns";
import { DeliveryStatus } from "~/providers/types";

export interface IParams {
  minutesToAdd?: number;
  reason?: string;
}

const createSentDeliveryStatusWithTtl = (
  params?: IParams
): { status: DeliveryStatus; response: { ttl: number; reason?: string } } => {
  const { minutesToAdd = 2, reason } = { ...params };
  const ttl = Math.floor(addMinutes(Date.now(), minutesToAdd).getTime() / 1000);

  return { status: "SENT", response: { ttl, reason } };
};

export default createSentDeliveryStatusWithTtl;
