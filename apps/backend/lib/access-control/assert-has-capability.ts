import makeError from "make-error";

import expandWildcardAction from "./expand-wildcard-action";
import matchResource from "./match-resource";
import { Action, IPolicyStatement, IRole, WildcardAction } from "./types";

const WILDCARD = "*";

export const CapabilityAssertionError = makeError("CapabilityAssertionError");

type AssertHasCapabilityFn = (
  role: IRole,
  requestedAction: Action | WildcardAction,
  requestedResource?: string
) => void;

const assertHasCapability: AssertHasCapabilityFn = (
  role,
  requestedAction,
  resource
) => {
  let foundExplicitAllow = false;

  for (const policy of role.policies) {
    for (const statement of policy.statements) {
      const assertActions = (actions: IPolicyStatement["actions"]) => {
        for (const action of actions) {
          // if the action includes a wildcard, we should unfurl the wildcard
          // in to explicit actions
          if (action.includes(WILDCARD)) {
            assertActions(expandWildcardAction(action as WildcardAction));
            continue;
          }

          if (
            action === requestedAction &&
            matchResource(statement.resources, resource)
          ) {
            // matching explicit denies always take precedent
            if (statement.effect === "DENY") {
              throw new CapabilityAssertionError("Explicit Deny");
            }
            foundExplicitAllow = true;
          }
        }
      };

      assertActions(statement.actions);
    }
  }

  if (!foundExplicitAllow) {
    throw new CapabilityAssertionError("No matching policy found");
  }
};

export default assertHasCapability;
