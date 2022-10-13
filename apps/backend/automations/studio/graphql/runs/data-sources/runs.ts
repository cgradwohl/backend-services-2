import { DataSourceConfig } from "apollo-datasource";
import { invokeAutomation } from "~/automations/lib/invoke-automation";
import runs from "~/automations/lib/services/runs";
import steps from "~/automations/lib/services/steps";

import { InvalidStepDefinitionError } from "~/automations/lib/errors";
import {
  AutomationRunStatus,
  IAutomation,
  IAutomationInvokeRequest,
  IAutomationRunContext,
  IDefaults,
  IStep,
  Step,
} from "~/automations/types";
import { decode } from "~/lib/base64";
import { search as automationRunsSearch } from "~/lib/elastic-search/automation-runs";
import createEncodedId from "~/studio/graphql/lib/create-encoded-id";
import DataSource from "~/studio/graphql/lib/data-source";
import { IContext } from "~/studio/graphql/types";
import { validateSteps } from "~/automations/lib/validate-steps";

export interface IAutomationRunsSearchInput {
  after: string;
  limit: number;
  search: {
    text: string;
    startDate: string;
    endDate: string;
    statuses: string[];
  };
}
export default class TenantsDataSource extends DataSource {
  protected runs: ReturnType<typeof runs>;
  protected steps: ReturnType<typeof steps>;

  get objtype(): string {
    return "run";
  }

  public initialize(config: DataSourceConfig<IContext>) {
    super.initialize(config);
    const tenantId = this.getEnvScopedTenantId();
    this.runs = runs(tenantId);
    this.steps = steps(tenantId);
  }

  public async cancel(runId: string) {
    await this.runs.updateStatus(runId, AutomationRunStatus.canceled);

    return runId;
  }

  public async get(runId: string) {
    const run = await this.runs.get(runId);
    return this.map(run);
  }

  public async invoke(automation: IAutomationInvokeRequest & IDefaults) {
    const {
      runId,
      scope,
      data,
      override,
      profile,
      brand,
      recipient,
      template,
      templateId,
    } = automation;

    const tenantId = this.getEnvScopedTenantId();
    const runContext: IAutomationRunContext = {
      brand,
      data,
      profile,
      recipient,
      template,
    };

    try {
      await validateSteps(automation.steps, runContext, tenantId);
    } catch (error) {
      throw new InvalidStepDefinitionError(
        "Automation being invoked has invalid steps"
      );
    }

    await invokeAutomation({
      cancelation_token:
        automation.cancelation_token ?? automation.cancelationToken,
      steps: automation.steps,
      context: runContext,
      runId,
      scope,
      source: [`invoke/${templateId}`],
      tenantId,
    });

    return automation.runId;
  }

  public async list(searchInput?: IAutomationRunsSearchInput) {
    const tenantId = this.getEnvScopedTenantId();
    const { after, limit = 25, search } = searchInput;

    const runs = await automationRunsSearch({
      limit,
      next: after ? decode(after) : undefined,
      tenantId,
      text: search?.text,
      startDate: search?.startDate,
      endDate: search?.endDate,
      statuses: search?.statuses,
    });

    if (!runs?.items?.length) {
      return { items: [] };
    }

    return {
      items: runs.items.map(this.mapFromEs),
      next: runs?.next,
      prev: runs?.prev,
    };
  }

  public async getRunContext(runId: string) {
    try {
      return await this.runs.getContext(runId);
    } catch (err) {
      // older runs don't have a context, fallback to null
      return null;
    }
  }

  public async getStepsByRun(runId: string) {
    const steps = await this.steps.list(runId);

    if (!steps) {
      return { nodes: [] };
    }

    return {
      nodes: steps.map(this.mapStep),
    };
  }

  protected mapStep = (step: IStep) => {
    if (!step) {
      return null;
    }

    const stringKeysMap = {
      recipient: "recipient",
      template: "template",
      brand: "brand",
      list: "list",
      list_id: "list_id",
      recipient_id: "recipient_id",
      subscription: "subscription",
      duration: "duration",
      until: "until",
      delayFor: "delayFor",
      delayUntil: "delayUntil",
      cancelation_token: "cancelation_token",
      cancelationToken: "cancelationToken",
    };
    const stepWithStringAccessors = Object.keys(step).reduce((newStep, key) => {
      if (step[key] && stringKeysMap[key] && typeof step[key] === "object") {
        newStep[key] = JSON.stringify(step[key]);
      } else {
        newStep[key] = step[key];
      }
      return newStep;
    }, {});

    const id = createEncodedId(step.stepId.toString(), this.objtype);

    return {
      id,
      ...(stepWithStringAccessors as Step),
    };
  };

  protected map = (run: IAutomation) => {
    if (!run) {
      return null;
    }

    const source = run.source ?? ["UNKNOWN"];

    return {
      created: run.createdAt,
      id: createEncodedId(run.runId, this.objtype),
      runId: run.runId,
      // TODO: remove the fallbacks here in favor of normalizing DB data
      // NOTE: https://linear.app/trycourier/issue/C-2492/data-fix-automation-runs-that-have-empty-status-source-or-type
      source: typeof source === "string" ? [source] : source, // Backwards compatibility: turn old string sources to lists
      status: run.status ?? "ERROR",
      type: run.type ?? "automation-run",
    };
  };

  private mapFromEs = (run) => {
    if (!run) {
      return null;
    }

    return {
      created: run.createdAt,
      id: createEncodedId(run.runId, this.objtype),
      runId: run.runId,
      // TODO: remove the fallbacks here in favor of normalizing DB data
      // NOTE: https://linear.app/trycourier/issue/C-2492/data-fix-automation-runs-that-have-empty-status-source-or-type
      source: run.source ?? ["UNKNOWN"],
      status: run.status ?? "ERROR",
      type: run.type ?? "automation-run",
    };
  };
}
