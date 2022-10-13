import add from "date-fns/add";
import getUnixTime from "date-fns/getUnixTime";
import parseISO from "date-fns/parseISO";
import stepsService from "~/automations/lib/services/steps";
import {
  IAutomationDelayService,
  IDelayOptions,
  IDelayStep,
  IDelayStepFunctionData,
  IDelayStepWorkerItem,
} from "~/automations/types";
import { put } from "../stores/dynamo";

import { StepFunctions } from "aws-sdk";
import { StartExecutionInput } from "aws-sdk/clients/stepfunctions";
import validationSchemas from "~/automations/schemas";
import {
  InvalidDelayConfigurationError,
  InvalidDelayDurationError,
  InvalidDelayIntervalError,
} from "../errors";
import { humanReadableDelay } from "../regex";

const stepfunctions = new StepFunctions();
const schemas = validationSchemas({ additionalProperties: true });

export default class DelayService implements IAutomationDelayService {
  private step: IDelayStep;
  private steps;

  constructor(step: IDelayStep) {
    const validateDelay = schemas.delay;
    if (!validateDelay(step)) {
      throw new InvalidDelayConfigurationError();
    }
    this.step = step;
    this.steps = stepsService(step.tenantId);
  }

  public getDelayUnixTime() {
    // should not specify both values
    if (
      (this.step.duration ?? this.step.delayFor) &&
      (this.step.until ?? this.step.delayUntil)
    ) {
      throw new InvalidDelayConfigurationError();
    }

    // NOTE: delayUntil is deprecated syntax
    const until = this.step.until ?? this.step.delayUntil;
    if (until) {
      return getUnixTime(parseISO(until));
    }

    const duration = this.step.duration ?? this.step.delayFor;
    if (duration) {
      const [, stepDuration, interval] = duration.match(humanReadableDelay);

      if (!stepDuration) {
        throw new InvalidDelayDurationError();
      }
      if (!interval) {
        throw new InvalidDelayIntervalError();
      }

      return getUnixTime(
        // the replace regex will append an `s` to the end of the interval if
        // it does not exist. date-fns expects this to be a plural value
        // add() - Positive decimals will be rounded using Math.floor, decimals less than zero will be rounded using Math.ceil
        add(new Date(), { [interval.replace(/s?$/, "s")]: stepDuration })
      );
    }

    // neither duration or until specified
    throw new InvalidDelayConfigurationError();
  }

  public async startDelayStepFunction(
    expirydate: string,
    options: IDelayOptions
  ) {
    const payload: IDelayStepFunctionData = {
      ...this.step,
      ...this.steps.getDynamoKey(this.step),
      dryRunKey: options.dryRunKey,
      scope: options.scope,
      source: options.source,
      expirydate,
    };
    const params: StartExecutionInput = {
      input: JSON.stringify(payload),
      stateMachineArn: process.env.AUTOMATION_DELAY_STATE_MACHINE,
    };
    await stepfunctions.startExecution(params).promise();
  }

  // enters delay to the AUTOMATION_DELAY_TABLE with a Ttl 48 hours behind when the delay should finish
  public async enterDelayToDynamo(options: IDelayOptions) {
    const hour = 3600; // Number of seconds per hour
    const expirydate = this.getDelayUnixTime();
    const delayTableItem: IDelayStepWorkerItem = {
      ...this.step,
      ...this.steps.getDynamoKey(this.step),
      dryRunKey: options.dryRunKey,
      scope: options.scope,
      source: options.source,
      expirydate,
      ttl: expirydate - 48 * hour,
    };
    await put({
      Item: delayTableItem,
      TableName: process.env.AUTOMATION_DELAY_TABLE,
    });
  }

  public async enqueueDelay(options: IDelayOptions) {
    // Check if delay is for either less than or at least 48 hours
    const hour = 3600000; // Number of milliseconds per hour
    const date = new Date(this.getDelayUnixTime() * 1000);
    const lessThan48Hours = date.getTime() < new Date().getTime() + 48 * hour;
    if (lessThan48Hours) {
      // less than 48 hours so directly invoke step functions state machine
      await this.startDelayStepFunction(date.toISOString(), options);
    } else {
      // At least 48 hours so enter delay step to Dynamo with a TTL 48 hours behind
      await this.enterDelayToDynamo(options);
    }
  }
}
