import axios from "axios";
import qs from "qs";
import { ForbiddenError, ValidationError } from "apollo-server-lambda";
import { getItem, put } from "~/lib/dynamo";
import listApiKeys from "~/lib/tenant-service/list-api-keys";
import DataSource from "../lib/data-source";

interface VercelAccessToken {
  tenantId: string;
  configurationId: string;
  accessToken: string;
  teamId?: string;
}

interface VercelProject {
  env?: { id: string; key: string }[];
  id: string;
  name: string;
}

interface VercelPagination {
  count: number;
  next: number | null;
  prev: number | null;
}

const buildRequestParams = (vercelAccessToken: VercelAccessToken) => {
  return {
    params: { teamId: vercelAccessToken.teamId },
    headers: {
      Authorization: `Bearer ${vercelAccessToken.accessToken}`,
    },
  };
};

const VERCEL_CLIENT_ID = "oac_fgP0NDXaO4qtHRX1Y7Wer7TN";
const authTokenEnvVariableName = "COURIER_AUTH_TOKEN";
const clientKeyEnvVariableName = "COURIER_CLIENT_KEY";

export default class VercelIntegrationDataSource extends DataSource {
  private getVercelAccessToken = async (configurationId: string) => {
    const { tenantId } = this.context;

    const { Item } = await getItem({
      TableName: process.env.TENANT_VERCEL_ACCESS_TOKENS_TABLE_NAME,
      Key: { tenantId, configurationId },
    });

    return Item as VercelAccessToken | undefined;
  };

  public async install({
    configurationId,
    code,
    teamId,
  }: {
    configurationId: string;
    code: string;
    teamId: string;
  }) {
    const { tenantId } = this.context;

    const vercelAccessToken = await this.getVercelAccessToken(configurationId);

    if (vercelAccessToken) return;

    try {
      const {
        data: { access_token: accessToken },
      } = await axios.post<{ access_token: string }>(
        "https://api.vercel.com/v2/oauth/access_token",
        qs.stringify({
          client_id: VERCEL_CLIENT_ID,
          client_secret: process.env.VERCEL_CLIENT_SECRET,
          code,
          redirect_uri: process.env.APP_URL,
        })
      );

      await put({
        TableName: process.env.TENANT_VERCEL_ACCESS_TOKENS_TABLE_NAME,
        Item: { tenantId, configurationId, accessToken, teamId },
      });
    } catch {
      throw new ForbiddenError("Invalid Vercel code");
    }
  }

  public async getProjects({
    configurationId,
    ...args
  }: {
    configurationId: string;
    limit?: number;
    from?: number;
  }) {
    const vercelAccessToken = await this.getVercelAccessToken(configurationId);

    if (!vercelAccessToken) {
      throw new ValidationError("Vercel Integration not installed");
    }

    const requestParams = buildRequestParams(vercelAccessToken);
    const { data } = await axios.get<{
      projects: VercelProject[];
      pagination: VercelPagination;
    }>("https://api.vercel.com/v9/projects", {
      ...requestParams,
      params: { ...requestParams.params, ...args },
    });

    return {
      ...data,
      projects: data.projects.map((project) => ({
        id: project.id,
        name: project.name,
        enabled: !!project.env.find(
          (env) => env.key === authTokenEnvVariableName
        ),
      })),
    };
  }

  public async configure({
    configurationId,
    projectsToEnable,
    projectsToDisable,
  }: {
    configurationId: string;
    projectsToEnable: string[];
    projectsToDisable: string[];
  }) {
    const { tenantId } = this.context;

    const vercelAccessToken = await this.getVercelAccessToken(configurationId);

    if (!vercelAccessToken) {
      throw new ValidationError("Vercel Integration not installed");
    }

    const apiKeys = await listApiKeys(tenantId);
    const prodClientKey = Buffer.from(tenantId).toString("base64");
    const testClientKey = Buffer.from(`${tenantId}/test`).toString("base64");
    const testApiKey = apiKeys.find(
      (key) => key.scope === "published/test"
    ).authToken;
    const prodApiKey = apiKeys.find(
      (key) => key.scope === "published/production"
    ).authToken;

    await Promise.all([
      ...projectsToEnable?.flatMap((projectId) => [
        axios.post<void>(
          `https://api.vercel.com/v9/projects/${projectId}/env`,
          {
            type: "encrypted",
            key: authTokenEnvVariableName,
            value: prodApiKey,
            target: ["production"],
          },
          buildRequestParams(vercelAccessToken)
        ),
        axios.post<void>(
          `https://api.vercel.com/v9/projects/${projectId}/env`,
          {
            type: "encrypted",
            key: authTokenEnvVariableName,
            value: testApiKey,
            target: ["preview", "development"],
          },
          buildRequestParams(vercelAccessToken)
        ),
        axios.post<void>(
          `https://api.vercel.com/v9/projects/${projectId}/env`,
          {
            type: "encrypted",
            key: clientKeyEnvVariableName,
            value: prodClientKey,
            target: ["production"],
          },
          buildRequestParams(vercelAccessToken)
        ),
        axios.post<void>(
          `https://api.vercel.com/v9/projects/${projectId}/env`,
          {
            type: "encrypted",
            key: clientKeyEnvVariableName,
            value: testClientKey,
            target: ["preview", "development"],
          },
          buildRequestParams(vercelAccessToken)
        ),
      ]),
      ...projectsToDisable?.map(async (projectId) => {
        const { data: project } = await axios.get<VercelProject>(
          `https://api.vercel.com/v9/projects/${projectId}`,
          buildRequestParams(vercelAccessToken)
        );

        const envVariables = project.env.filter((env) =>
          [clientKeyEnvVariableName, authTokenEnvVariableName].includes(env.key)
        );

        return Promise.all(
          envVariables.map((variable) =>
            axios.delete<void>(
              `https://api.vercel.com/v9/projects/${projectId}/env/${variable.id}`,
              buildRequestParams(vercelAccessToken)
            )
          )
        );
      }),
    ]);
  }

  protected map = () => null;
}
