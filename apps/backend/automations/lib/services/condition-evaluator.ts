import * as vm2 from "vm2";

export const MessageStatus = {
  Skipped: 0,
  Queued: 1,
  Sent: 2,
  Delivered: 3,
  Opened: 4,
  Clicked: 5,
  Undeliverable: 6,
  Unmapped: 6,
};

export const convertStatusToNumber = (status) => {
  switch (status) {
    case "SKIPPED":
      return MessageStatus.Skipped;
    case "ENQUEUED":
      return MessageStatus.Queued;
    case "SENT":
      return MessageStatus.Sent;
    case "DELIVERED":
      return MessageStatus.Delivered;
    case "OPENED":
      return MessageStatus.Opened;
    case "CLICKED":
      return MessageStatus.Clicked;
    case "UNDELIVERABLE":
      return MessageStatus.Undeliverable;
    case "UNMAPPED":
      return MessageStatus.Unmapped;
  }
};

export default (condition: string, context?: any): boolean => {
  const sandbox = new vm2.VM({ sandbox: context ?? {} });
  const result = sandbox.run(condition);

  // result needs to be a boolean ?
  if (typeof result !== "boolean") {
    throw new Error("A Conditional expression must evaluate to a boolean.");
  }

  return result;
};
