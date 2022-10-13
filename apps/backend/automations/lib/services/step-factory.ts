import { AutomationStepStatus, Step, StepFactory } from "~/automations/types";
import { id } from "../stores/dynamo";

const stepFactory: StepFactory = (tenantId: string) => {
  return {
    create: (runId, step) => {
      const createStep = (step, props?): Step => {
        return {
          ...step,
          ...props,
          context: step.context ?? {},
          created: new Date().toISOString(),
          runId,
          stepId: id(),
          status: AutomationStepStatus.notProcessed,
          tenantId,
          type: "automation-step",
          updated: new Date().toISOString(),
        };
      };

      switch (step.action) {
        case "send":
          // TODO: validate the step is a proper IInboundSendStep
          if (!step.message) {
            return createStep(step, {
              brand: step.brand,
              data: step.data ?? {},
              override: step.override ?? {},
              profile: step.profile ?? {},
              recipient: step.recipient,
              template: step.template,
            });
          }

          return createStep(step);

        case "send-list":
          // TODO: validate the step is a proper IInboundSendListStep
          return createStep(step, {
            brand: step.brand,
            data: step.data ?? {},
            override: step.override ?? {},
            template: step.template,
          });

        default:
          return createStep(step);
      }
    },
  };
};

export default stepFactory;
