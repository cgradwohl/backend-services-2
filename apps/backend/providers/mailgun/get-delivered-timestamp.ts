import { match } from "typescript-pattern-matching";
import { GetDeliveredTimestamp } from "../types";
import { IMailgunEventLog } from "./types";

const getDeliveredTimestamp: GetDeliveredTimestamp = (providerResponse) => {
  const { data } =
    typeof providerResponse === "string"
      ? JSON.parse(providerResponse)
      : providerResponse;

  const items: IMailgunEventLog[] = match<
    IMailgunEventLog[] | { items: IMailgunEventLog[] },
    IMailgunEventLog[]
  >(data)
    .with([{ event: String }], (x) => x)
    .with({ items: [{ event: String }] }, (x) => x.items)
    .otherwise(() => undefined)
    .run();

  if (!items) {
    return undefined;
  }

  const deliveredEvent = items.find(({ event }) => event === "delivered");

  return deliveredEvent
    ? Math.round(deliveredEvent.timestamp * 1000)
    : undefined;
};

export default getDeliveredTimestamp;
