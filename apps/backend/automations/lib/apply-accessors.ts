import { JSONObject, JSON } from "~/types.api";
import { IAutomationRunContext, Step } from "../types";
import stepsService from "./services/steps";
import refsService from "./services/steps-reference";

export const getValue = (
  path: string, // data.foo.bar
  context: any
) => {
  const [root, ...restPath] = path.split(".");

  // with context we need the root to dill down into the context object
  return restPath.reduce((acc, property) => {
    return acc && acc[property] ? acc[property] : null;
  }, context);
};

export const isAccessorType = (value: JSONObject) =>
  value && value.$ref && typeof value.$ref === "string";

export const isObjectType = (value: JSONObject) =>
  value && typeof value === "object" && !Array.isArray(value);

export const applyAccessors = async (
  property: Step | JSONObject,
  context: IAutomationRunContext,
  ids: Step | JSON
): Promise<Step | JSONObject> => {
  const steps = stepsService(ids["tenantId"]);
  const refs = refsService(ids["tenantId"]);

  let acc = {};
  for (const [key, value] of Object.entries(property)) {
    if (isObjectType(value)) {
      // this means we have $ref
      if (isAccessorType(value)) {
        const [root, ...restPath] = value.$ref.split(".");
        // now check if root is a step-reference
        const ref = await refs.get(ids["runId"], root);

        if (ref) {
          const stepWithMeta = await steps.getStepWithContextByRef(
            ids["runId"],
            root
          );

          acc = { ...acc, [key]: getValue(value.$ref, stepWithMeta) };
        } else {
          acc = { ...acc, [key]: getValue(value.$ref, context[root]) };
        }
      } else {
        // recursive call to non accessor object type (searching for nested accessors)
        acc = { ...acc, [key]: await applyAccessors(value, context, ids) };
      }
    } else {
      acc = { ...acc, [key]: value };
    }
  }

  return acc as Step | JSONObject;
};
