import extend from "deep-extend";
import { TemplateMessage } from "~/api/send/types";
import {
  IAutomationRunContext,
  ISendStepV1,
  ISendStepV2,
  Step,
} from "../types";

// if root level prop is defined, then extend root with step (step takes precedence), otherwise use step
// note: a deep copy of root prop is required to prevent nested object mutation (this will stringify new Date(), and delete 'undefined' props)
export const deepExtend = (rootProperty, stepProperty) =>
  rootProperty
    ? extend(JSON.parse(JSON.stringify(rootProperty)) ?? {}, stepProperty ?? {})
    : stepProperty;

export const resolveProfile = (step, context) => {
  if (context?.recipient) {
    return deepExtend(context?.profile, {
      user_id: context?.recipient,
      ...step?.message?.to,
    });
  }

  return deepExtend(context?.profile, {
    ...step?.message?.to,
  });
};

export const resolveBrand = (step, context) => {
  if (step?.message?.brand_id) {
    return step?.message?.brand_id;
  }

  if (context?.brand) {
    return context?.brand;
  }

  return undefined;
};

export const resolveData = (
  step: ISendStepV2,
  context: IAutomationRunContext
) => {
  return deepExtend(context?.data, step?.message?.data) ?? undefined;
};

export const resolveTemplate = (
  step: ISendStepV2,
  context: IAutomationRunContext
) => {
  if ((step?.message as TemplateMessage)?.template) {
    return (step?.message as TemplateMessage)?.template;
  }

  if (context?.template) {
    return context?.template;
  }

  return undefined;
};

export const extendV2SendStep = (
  step: ISendStepV2,
  context: IAutomationRunContext
) => {
  const to = resolveProfile(step, context);
  const brand_id = resolveBrand(step, context);
  const data = resolveData(step, context);
  const template = resolveTemplate(step, context);

  return {
    ...step,
    message: {
      ...step?.message,
      ...(to ? { to } : undefined),
      ...(brand_id ? { brand_id } : undefined),
      ...(data ? { data } : undefined),
      ...(template ? { template } : undefined),
    },
  };
};

export const extendStep = (
  step: Step,
  context: IAutomationRunContext
): Step => {
  switch (step.action) {
    case "send":
      if (!step.message) {
        return {
          ...(step as ISendStepV1),
          brand: step.brand ?? context.brand,
          data: deepExtend(context.data, step.data) ?? {},
          override: step.override ?? {},
          profile: deepExtend(context.profile, step.profile) ?? {},
          recipient: step.recipient ? step.recipient : context.recipient,
          template: step.template ?? context.template,
        };
      }

      return extendV2SendStep(
        step as ISendStepV2,
        context as IAutomationRunContext
      );

    case "send-list":
      return {
        ...step,
        brand: step.brand ?? context.brand,
        data: deepExtend(context.data, step.data) ?? {},
        override: step.override ?? {},
        template: step.template ?? context.template,
      };

    default:
      return step;
  }
};
