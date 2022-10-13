import { compareDesc } from "date-fns";
import { ISnoozeRule } from "~/preferences/types";

type CheckIfSnoozeFn = (rule: ISnoozeRule) => boolean;

export const checkIfSnooze: CheckIfSnoozeFn = (rule) =>
  compareDesc(new Date(), new Date(rule.until)) === 1;
