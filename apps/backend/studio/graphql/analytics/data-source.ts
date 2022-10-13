import { toUuid } from "~/lib/api-key-uuid";
import { listProviders } from "~/lib/configurations-service";
import allProviders from "~/providers";
import DataSource from "../lib/data-source";
import {
  getAuthToken,
  getChannelPerformanceData,
  getSendVolumeData,
  RelativeTimeRange,
} from "../lib/propel";
import {
  channelPerformance as mockedChannelPerformance,
  sendVolume as mockedSendVolume,
} from "./__mocks__/data";

export default class AnalyticsDataSource extends DataSource {
  public getSendVolume = async (
    templateId: string,
    filters: {
      channel: string;
      relative: RelativeTimeRange;
    }
  ) => {
    if (["dev", "staging"].includes(process.env.STAGE)) {
      return mockedSendVolume;
    }

    // catch error if for whatever reason the opened/clicked values are greater than sent value
    const capPercentageValue = (input: number) => {
      return input >= 100 ? 100 : input;
    };

    // propel has `production` and `test` environments
    const { env = "production", tenantId: workspaceId } = this.context;
    templateId = toUuid(templateId);

    const authToken: string = await getAuthToken();
    if (!authToken) {
      throw new Error("Could not retrieve propel auth token");
    }

    const [sent, errors, opened, clicked] = await Promise.all([
      getSendVolumeData(authToken, "SENT", {
        env,
        templateId,
        workspaceId,
        ...filters,
      }),
      getSendVolumeData(authToken, "PROVIDER_ERROR", {
        env,
        templateId,
        workspaceId,
        ...filters,
      }),
      getSendVolumeData(authToken, "OPENED", {
        env,
        templateId,
        workspaceId,
        ...filters,
      }),
      getSendVolumeData(authToken, "CLICKED", {
        env,
        templateId,
        workspaceId,
        ...filters,
      }),
    ]);

    return Object.keys(sent.labels).reduce((acc, index) => {
      acc.push({
        errors: Number(errors.values[index]),
        label: sent.labels[index],
        sent: Number(sent.values[index]),
        opened:
          Number(sent.values[index]) > 0
            ? capPercentageValue(
                (Number(opened.values[index]) / Number(sent.values[index])) *
                  100
              ).toFixed(2)
            : 0,
        clicked:
          Number(sent.values[index]) > 0
            ? capPercentageValue(
                (Number(clicked.values[index]) / Number(sent.values[index])) *
                  100
              ).toFixed(2)
            : 0,
      });
      return acc;
    }, []);
  };

  public getChannelPerformance = async (
    templateId: string,
    filters: { channel: string; relative: string }
  ) => {
    if (["dev", "staging"].includes(process.env.STAGE)) {
      return mockedChannelPerformance;
    }

    // propel has `production` and `test` environments
    const { env = "production", tenantId: workspaceId } = this.context;
    templateId = toUuid(templateId);

    // get providers for the workspace
    // this helps us avoid 413s
    // ensure we are scoping correctly as per `listProviders()` expectations
    const providers = (
      await listProviders(
        env === "test" ? `${workspaceId}/${env}` : workspaceId
      )
    ).map((config) => {
      return config.json.provider;
    });

    const channels = [
      "email",
      "direct_message",
      "sms",
      "push",
      "webhook",
      "banner",
      "inbox",
    ].filter((channel) => {
      // all channels
      if (!filters.channel) {
        return true;
      }
      if (filters.channel === "other") {
        return !["email", "sms", "push"].includes(channel);
      }
      // email | push | sms channels
      return channel === filters.channel;
    });

    const authToken: string = await getAuthToken();
    if (!authToken) {
      throw new Error("Could not retrieve propel auth token");
    }

    const channelPerformance = await getChannelPerformanceData(
      authToken,
      channels,
      providers,
      {
        env,
        templateId,
        workspaceId,
        ...filters,
      }
    );

    if (!channelPerformance) {
      throw new Error("Could not retrieve channel performance data");
    }

    const { clicked, delivered, errors, opened, sent } = channelPerformance;

    const data = [];
    for (const channel of channels) {
      if (Number(sent[channel].value) || Number(errors[channel].value)) {
        data.push({
          clicked: Number(clicked[channel].value),
          delivered: Number(delivered[channel].value),
          downstream: channel,
          errors: Number(errors[channel].value),
          opened: Number(opened[channel].value),
          sent: Number(sent[channel].value),
        });

        // providers for the channel
        for (const provider of providers) {
          if (allProviders[provider]?.taxonomy?.channel !== channel) {
            continue;
          }
          let providerKey = provider.replace(/\-/g, "_");
          // this is necessary because webhook is also a channel filter
          if (provider === "webhook") {
            providerKey = "provider_webhook";
          }
          if (
            Number(sent[providerKey].value) ||
            Number(errors[providerKey].value)
          ) {
            data.push({
              clicked: Number(clicked[providerKey].value),
              delivered: Number(delivered[providerKey].value),
              downstream: provider,
              errors: Number(errors[providerKey].value),
              opened: Number(opened[providerKey].value),
              sent: Number(sent[providerKey].value),
            });
          }
        }
      }
    }
    return data;
  };

  protected map = () => null;
}
