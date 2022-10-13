import { IResolver } from "../types";

const getSendVolume: IResolver = async (_, args, context) => {
  const { channel, relative, templateId } = args;

  return context.dataSources.analytics.getSendVolume(templateId, {
    channel,
    relative,
  });
};

const getChannelPerformance: IResolver = async (_, args, context) => {
  const { channel, relative, templateId } = args;

  return context.dataSources.analytics.getChannelPerformance(templateId, {
    channel,
    relative,
  });
};

export default {
  Query: {
    getChannelPerformance,
    getSendVolume,
  },
};
