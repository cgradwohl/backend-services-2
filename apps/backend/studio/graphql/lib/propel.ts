import axios from "axios";
import logger from "~/lib/logger";

const apiUrl = "https://api.us-east-2.propeldata.com/graphql";
const authUrl = "https://auth.us-east-2.propeldata.com/oauth2/token";
const base64Auth = Buffer.from(
  `${process.env.PROPEL_CLIENT_ID}:${process.env.PROPEL_CLIENT_SECRET}`,
  "utf-8"
).toString("base64");

export const getAuthToken = async () => {
  try {
    const response = await axios.post(
      authUrl,
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${base64Auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return response.data.access_token;
  } catch (err) {
    logger.error(`Error occurred while fetching propel auth token`, err);
  }
};

export enum RelativeTimeRange {
  TODAY,
  THIS_WEEK,
  THIS_MONTH,
  THIS_YEAR,
  YESTERDAY,
  PREVIOUS_WEEK,
  PREVIOUS_MONTH,
  PREVIOUS_YEAR,
  LAST_12_HOURS,
  LAST_24_HOURS,
  LAST_7_DAYS,
  LAST_30_DAYS,
  LAST_90_DAYS,
  LAST_3_MONTHS,
  LAST_6_MONTHS,
  LAST_YEAR,
  LAST_2_YEARS,
  LAST_5_YEARS,
}

type METRIC = "DELIVERED" | "PROVIDER_ERROR" | "SENT" | "CLICKED" | "OPENED";

type PROPEL_ENV = "test" | "production";

const METRIC_MAP: { [K in METRIC]: string } = {
  CLICKED: "EventLogsUniqueClickCount",
  DELIVERED: "EventLogsDeliveredCount",
  OPENED: "EventLogsUniqueOpenCount",
  PROVIDER_ERROR: "EventLogsProviderErrorCount",
  SENT: "EventLogsSendCount",
};

// dynamic counter query input builder for a provider
const buildProviderCounterInput = (
  provider: string,
  templateId: string,
  workspaceId: string,
  env: string,
  options: {
    relative: string;
  }
) => {
  return `input: {
      filters: [
        {
          column: "WORKSPACE_ID"
          operator: EQUALS
          value: "${workspaceId}"
        }
        {
          column: "SEND_ENVIRONMENT"
          operator: EQUALS
          value: "${env}"
        }
        {
          column: "MESSAGE_TEMPLATE_ID"
          operator: EQUALS
          value: "${templateId}"
        }
        {
          column: "PROVIDER"
          operator: EQUALS
          value: "${provider}"
        }
      ]
      timeRange: {
        relative: ${options.relative}
      },
    }`;
};

// builds queries for all providers
const buildProviderQueries = (
  providers: string[],
  templateId: string,
  workspaceId: string,
  env: string,
  options: {
    relative: string;
  }
) => {
  let providerQuery = "";
  providers.map((provider) => {
    let alias = provider.replace(/\-/g, "_");
    // this is necessary because webhook is also a channel filter
    if (provider === "webhook") {
      alias = "provider_webhook";
    }
    providerQuery += `
      ${alias}: counter(${buildProviderCounterInput(
      provider,
      templateId,
      workspaceId,
      env,
      {
        relative: options.relative,
      }
    )}) {
        value
      }
    `;
  });
  return providerQuery;
};

// dynamic counter query input builder for a channel
const buildChannelCounterInput = (
  channel: string,
  templateId: string,
  workspaceId: string,
  env: string,
  options: {
    relative: string;
  }
) => {
  return `input: {
      filters: [
        {
          column: "WORKSPACE_ID"
          operator: EQUALS
          value: "${workspaceId}"
        }
        {
          column: "SEND_ENVIRONMENT"
          operator: EQUALS
          value: "${env}"
        }
        {
          column: "MESSAGE_TEMPLATE_ID"
          operator: EQUALS
          value: "${templateId}"
        }
        {
          column: "CHANNEL"
          operator: EQUALS
          value: "${channel}"
        }
      ]
      timeRange: {
        relative: ${options.relative}
      },
    }`;
};

// builds queries for all channels
const buildChannelQueries = (
  channels: string[],
  templateId: string,
  workspaceId: string,
  env: string,
  options: {
    relative: string;
  }
) => {
  let channelQuery = "";
  channels.map((channel) => {
    const alias = channel;
    channelQuery += `
      ${alias}: counter(${buildChannelCounterInput(
      channel,
      templateId,
      workspaceId,
      env,
      {
        relative: options.relative,
      }
    )}) {
        value
      }
    `;
  });
  return channelQuery;
};

const getGranularity = (relative: string) => {
  switch (relative) {
    case "TODAY":
    case "YESTERDAY":
    case "LAST_12_HOURS":
    case "LAST_24_HOURS":
      return "HOUR";
    case "LAST_90_DAYS":
    case "LAST_3_MONTHS":
      return "WEEK";
    case "LAST_6_MONTHS":
    case "LAST_YEAR":
    case "PREVIOUS_YEAR":
    case "LAST_2_YEARS":
    case "LAST_5_YEARS":
      return "MONTH";
    default:
      return "DAY";
  }
};

const getChannelFilters = (channel: string) => {
  if ("other" === channel) {
    return [
      {
        column: "CHANNEL",
        operator: "NOT_EQUALS",
        value: "email",
      },
      {
        column: "CHANNEL",
        operator: "NOT_EQUALS",
        value: "push",
      },
      {
        column: "CHANNEL",
        operator: "NOT_EQUALS",
        value: "sms",
      },
    ];
  }
  return [
    {
      column: "CHANNEL",
      operator: "EQUALS",
      value: `${channel}`,
    },
  ];
};

export const getSendVolumeData = async (
  authToken: string,
  metric: METRIC,
  filters: {
    channel?: string;
    relative?: RelativeTimeRange;
    templateId: string;
    workspaceId: string;
    env: string;
  }
) => {
  const relative = filters.relative ?? "PREVIOUS_WEEK";
  const query = `
    query metricByName($uniqueName: String!, $input: TimeSeriesInput!) {
      metricByName(uniqueName: $uniqueName) {
        timeSeries(input: $input) {
          labels
          values
        }
      }
    }
  `;
  const variables = {
    input: {
      filters: [
        {
          column: "WORKSPACE_ID",
          operator: "EQUALS",
          value: `${filters.workspaceId}`,
        },
        {
          column: "SEND_ENVIRONMENT",
          operator: "EQUALS",
          value: `${filters.env}`,
        },
        {
          column: "MESSAGE_TEMPLATE_ID",
          operator: "EQUALS",
          value: `${filters.templateId}`,
        },
      ]
        .concat(filters.channel && getChannelFilters(filters.channel))
        .filter(Boolean),
      granularity: getGranularity(relative.toString()),
      timeRange: {
        relative,
      },
    },
    uniqueName: `${METRIC_MAP[metric]}`,
  };

  try {
    const { data } = await axios({
      data: {
        query,
        variables,
      },
      headers: {
        Authorization: `Bearer ${authToken}`,
        "content-type": "application/json",
      },
      method: "post",
      url: apiUrl,
    });

    if (!data.data) {
      throw new Error("Malformed send volume data");
    }

    const { labels, values } = data?.data?.metricByName?.timeSeries as {
      labels: [string];
      values: [string];
    };

    return { labels, values };
  } catch (err) {
    logger.error(
      `Error occurred while fetching send volume data for template ${filters.templateId} of workspace ${filters.workspaceId} in env ${filters.env}`,
      err
    );
  }
};

export const getChannelPerformanceData = async (
  authToken: string,
  channels: string[],
  providers: string[],
  filters: {
    relative: string;
    templateId: string;
    workspaceId: string;
    env: string;
  }
) => {
  const { relative = "PREVIOUS_WEEK", templateId, workspaceId, env } = filters;

  const query = `
    query {
      sent: metricByName(uniqueName: "${METRIC_MAP.SENT}") {
        ${buildChannelQueries(channels, templateId, workspaceId, env, {
          relative,
        })}
        ${buildProviderQueries(providers, templateId, workspaceId, env, {
          relative,
        })}
      }
      clicked: metricByName(uniqueName: "${METRIC_MAP.CLICKED}") {
        ${buildChannelQueries(channels, templateId, workspaceId, env, {
          relative,
        })}
        ${buildProviderQueries(providers, templateId, workspaceId, env, {
          relative,
        })}
      }
      delivered: metricByName(uniqueName: "${METRIC_MAP.DELIVERED}") {
        ${buildChannelQueries(channels, templateId, workspaceId, env, {
          relative,
        })}
        ${buildProviderQueries(providers, templateId, workspaceId, env, {
          relative,
        })}
      }
      opened: metricByName(uniqueName: "${METRIC_MAP.OPENED}") {
        ${buildChannelQueries(channels, templateId, workspaceId, env, {
          relative,
        })}
        ${buildProviderQueries(providers, templateId, workspaceId, env, {
          relative,
        })}
      }
      errors: metricByName(uniqueName: "${METRIC_MAP.PROVIDER_ERROR}") {
        ${buildChannelQueries(channels, templateId, workspaceId, env, {
          relative,
        })}
        ${buildProviderQueries(providers, templateId, workspaceId, env, {
          relative,
        })}
      }
    }
  `;

  try {
    const { data } = await axios({
      data: {
        query,
      },
      headers: {
        Authorization: `Bearer ${authToken}`,
        "content-type": "application/json",
      },
      method: "post",
      url: apiUrl,
    });

    if (!data.data) {
      throw new Error("Malformed channel performance data");
    }

    const { sent, errors, clicked, delivered, opened } = data?.data as {
      sent: {
        [key: string]: {
          value: string;
        };
      };
      errors: {
        [key: string]: {
          value: string;
        };
      };
      clicked: {
        [key: string]: {
          value: string;
        };
      };
      delivered: {
        [key: string]: {
          value: string;
        };
      };
      opened: {
        [key: string]: {
          value: string;
        };
      };
    };

    return {
      clicked,
      delivered,
      errors,
      opened,
      sent,
    };
  } catch (err) {
    logger.error(
      `Error occurred while fetching channel performance data for template ${templateId} of workspace ${workspaceId} in env ${env}`,
      err
    );
  }
};
