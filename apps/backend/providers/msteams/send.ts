import { ProviderConfigurationError } from "../errors";
import { DeliveryHandler } from "../types";
import { getAccessToken, getUserConversation, invokeMSTeams } from "./utils";

import { mergeObjects } from "json-merger";

interface IMSTeamsConfig {
  channel_id: string;
  conversation_id?: string;
  service_url: string;
  tenant_id: string;
  user_id?: string;
}

/*
Posting a message via Bot: https://stackoverflow.com/questions/47458405/how-can-i-get-my-bot-to-post-a-message-to-a-microsoft-teams-channel#:~:text=ts.,team%2C%20which%20requires%20a%20manifest
Another link: https://docs.microsoft.com/en-us/microsoftteams/platform/resources/bot-v3/bot-conversations/bots-conv-channel
Publishing a bot to MS Teams: https://docs.microsoft.com/en-us/power-virtual-agents/publication-add-bot-to-microsoft-teams
Send Non Reply messages as HTTP Call:https://docs.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-connector-send-and-receive-messages?view=azure-bot-service-4.0#send-message
Send proactive message: https://docs.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet
Getting Team Details: https://docs.microsoft.com/en-us/microsoftteams/platform/bots/how-to/get-teams-context?tabs=typescript

Sample Team Channel URL:
  https://teams.microsoft.com/l/channel/19%3aa52e21710de34c65b9f2e09ededaad2a%40thread.skype/General?groupId=feb55fc1-9e00-40f3-93b8-f7d14703f4dd&tenantId=dabd1935-56a4-4305-938e-0840e2e84515
*/
const send: DeliveryHandler = async (params, template) => {
  const config = params.config as unknown as {
    appId: string;
    appPassword: string;
  };

  const appId = params?.override?.config?.appId ?? config?.appId;
  const appPassword =
    params?.override?.config?.appPassword ?? config?.appPassword;

  if (!appId?.length) {
    throw new ProviderConfigurationError("No App ID specified.");
  }

  if (!appPassword?.length) {
    throw new ProviderConfigurationError("No App Password specified.");
  }

  const profile = params.profile.ms_teams as unknown as IMSTeamsConfig;
  const channelId = profile.channel_id as string;
  let conversationId = profile.conversation_id as string;
  const serviceUrl = profile.service_url as string;
  const tenantId = profile.tenant_id as string;
  const userId = profile.user_id as string;
  const [message, adaptiveCard] = template.msteams;

  let msg: any = {};

  // Construct the message (https://docs.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-connector-api-reference?view=azure-bot-service-4.0#activity-object)
  if (message) {
    msg.type = "message";
    msg.textFormat = "markdown";
    msg.text = message
      .replace(/<br>/g, "\n")
      .replace(/<br\/>/g, "\n")
      .replace(/<br \/>/g, "\n");
  }

  if (adaptiveCard) {
    msg.type = "message";
    msg.attachments = [
      {
        content: adaptiveCard,
        contentType: "application/vnd.microsoft.card.adaptive",
      },
    ];
  }

  msg = mergeObjects([
    msg,
    {
      from: { id: appId },
      conversation: {
        tenantId: tenantId,
      },
      channelId: "msteams",
      serviceUrl: serviceUrl,
      recipient: { id: userId },
    },
  ]);

  // Retrieve the auth bearer token
  const token = await getAccessToken({ appId, appPassword });

  if (channelId) {
    const channelUrl = `${serviceUrl}/v3/conversations/${encodeURIComponent(
      channelId
    )}/activities`;

    return (await invokeMSTeams({ url: channelUrl, msg, token })).data;
  }

  if (!conversationId) {
    // userId must exist: Initiate a conversation to userId to retrieve conversationId
    conversationId = await getUserConversation({
      msg,
      serviceUrl,
      appId,
      userId,
      tenantId,
      token,
    });
  }

  // Add conversationId to msg
  msg = mergeObjects([msg, { conversation: { id: conversationId } }]);

  const conversationUrl = `${serviceUrl}/v3/conversations/${encodeURIComponent(
    conversationId
  )}/activities`;

  return (await invokeMSTeams({ url: conversationUrl, msg, token })).data;
};

export default send;
