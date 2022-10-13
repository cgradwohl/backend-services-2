import { emitWorkspaceNameChangedEvent } from "~/auditing/services/emit";
import getCourierClient from "~/lib/courier";
import { archiveKey, queryByTenantId } from "~/lib/dynamo/tenant-auth-tokens";
import * as tenants from "~/lib/tenant-service";
import listTenants from "~/lib/tenant-service/list";
import { ITenant } from "~/types.api";
import createEncodedId from "../lib/create-encoded-id";
import DataSource from "../lib/data-source";

const courier = getCourierClient();

export interface LinkToWorkspaceInfo {
  email: string;
  loginMethodUsed: string;
  user_id: string;
  workspaceName: string;
}

export default class TenantsDataSource extends DataSource {
  get objtype(): string {
    return "tenant";
  }

  public async current() {
    return this.get(this.context.tenantId);
  }

  public async get(tenantId: string) {
    const tenant = await tenants.get(tenantId);
    return this.map(tenant);
  }

  public async list(userId: string) {
    const items = await listTenants(userId);

    // TODO: fix this weirdness
    // listTenants returns TenantsGetResponseTenant[] type
    // But below we map that onto ITenant type

    return {
      items: items.map(this.map),
      // no paging current necessary
      lastEvaluatedKey: null,
    };
  }

  public async archive() {
    const { tenantId } = this.context;
    const tenantAuthTokens = await queryByTenantId(tenantId);

    await tenants.update({ tenantId }, { archived: Date.now() });
    await Promise.all(
      tenantAuthTokens.map(async (tenantAuthToken) => {
        return archiveKey(tenantAuthToken.authToken, tenantId);
      })
    );

    return {
      id: createEncodedId(tenantId, this.objtype),
      success: true,
    };
  }

  public async setName(name: string) {
    if (name.length > 100) {
      return { success: false };
    }

    const { tenantId, user } = this.context;
    await tenants.update({ tenantId }, { name });

    const actor: { id: string; email: string } = {
      email: user?.email ?? "",
      id: user?.id ?? "",
    };

    await emitWorkspaceNameChangedEvent(
      "published/production",
      new Date(),
      actor,
      tenantId
    );

    return {
      id: createEncodedId(tenantId, this.objtype),
      name,
      success: true,
    };
  }

  public async setSetUpInfo(channelInterests: string[], stackLang: string) {
    const { tenantId } = this.context;
    await tenants.update({ tenantId }, { channelInterests, stackLang });

    return {
      id: createEncodedId(tenantId, this.objtype),
      stackLang,
      success: true,
    };
  }

  public async setCurrentOnboardingStep(currentOnboardingStep: string) {
    const { tenantId } = this.context;
    await tenants.update({ tenantId }, { currentOnboardingStep });

    return {
      id: createEncodedId(tenantId, this.objtype),
      currentOnboardingStep,
      success: true,
    };
  }

  public async setHideSetupProgress(hide: boolean) {
    const { tenantId } = this.context;
    await tenants.update({ tenantId }, { hideSetupProgress: hide });
    return {
      id: createEncodedId(tenantId, this.objtype),
      hideSetupProgress: hide,
      success: true,
    };
  }

  public async setShowCourierFooter(show: boolean) {
    const { tenantId } = this.context;
    await tenants.update({ tenantId }, { showCourierFooter: show });
    return {
      id: createEncodedId(tenantId, this.objtype),
      showCourierFooter: show,
      success: true,
    };
  }

  public async sendWorkspaceLink(payload: LinkToWorkspaceInfo) {
    const result = await courier.send({
      data: {
        workspaceName: payload.workspaceName,
        loginMethodUsed: payload.loginMethodUsed,
      },
      eventId: "ONBOARDING_WORKSPACE_LINK",
      profile: {
        email: payload.email,
      },
      recipientId: payload.user_id ?? payload.email,
    });
    return {
      success: result !== undefined,
    };
  }

  public async setHmacEnabled(hmacEnabled: boolean) {
    const { tenantId } = this.context;
    await tenants.update({ tenantId }, { customerRoutes: { hmacEnabled } });
    return {
      hmacEnabled,
      id: createEncodedId(tenantId, this.objtype),
      success: true,
    };
  }

  protected map(tenant: ITenant) {
    if (!tenant) {
      return null;
    }

    return {
      apiKey: tenant.apiKey,
      created: tenant.created,
      customerRoutes: tenant.customerRoutes,
      hideSetupProgress: tenant.hideSetupProgress,
      id: createEncodedId(tenant.tenantId, this.objtype),
      currentOnboardingStep: tenant.currentOnboardingStep,
      name: tenant.name,
      owner: tenant.owner ?? tenant.creator,
      showCourierFooter: tenant.showCourierFooter,
      stackLang: tenant.stackLang,
      tenantId: tenant.tenantId,
      type: "tenant",
      usage: tenant.usageActual ?? 0,
    };
  }
}
