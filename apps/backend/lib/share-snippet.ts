import getCourierClient from "~/lib/courier";
const courier = getCourierClient();

const shareSnippet = async ({
  email,
  fromEmail,
  language,
  snippet,
}: {
  email: string;
  fromEmail: string;
  snippet: string;
  language: string;
}): Promise<{
  messageId: string;
}> => {
  return await courier.send({
    data: { snippet, language, fromEmail },
    eventId: "SHARE_SNIPPET",
    profile: { email },
    recipientId: email,
  });
};
export default shareSnippet;
