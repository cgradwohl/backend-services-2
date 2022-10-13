export const validComplete = {
  archived: false,
  json: {
    blocks: [
      {
        config: `{"try": "courier"}`,
        id: "c456c883-a625-4d9b-bc0c-9642c5d00841",
        type: "text",
      },
    ],
    channels: {
      always: [
        {
          blockIds: ["c456c883-a625-4d9b-bc0c-9642c5d00841"],
          config: {
            email: {
              emailSubject: "Email Subject",
              emailTemplateConfig: {
                templateName: "line",
                topBarColor: "#58C87A",
                headerLogoAlign: "left",
              },
            },
          },
          id: "ff16c47a-9f65-418f-8a72-199cbf4e8acc",
          providers: [
            {
              config: {},
              configurationId: "ff16c47a-9f65-418f-8a72-199cbf4e8acc",
              key: "sendgrid",
            },
          ],
          taxonomy: "email:sendgrid",
        },
      ],
      bestOf: [
        {
          blockIds: ["c456c883-a625-4d9b-bc0c-9642c5d00841"],
          id: "f4e947cb-72b6-4565-9cc7-6020ee09d920",
          providers: [
            {
              config: {
                fbMessenger: {
                  tag: "#trycourier",
                  fromAddress: "@trycourier",
                },
              },
              configurationId: "f4e947cb-72b6-4565-9cc7-6020ee09d920",
              key: "facebook-messenger",
            },
          ],
          taxonomy: "direct_message:facebook-messenger",
        },
        {
          blockIds: ["c456c883-a625-4d9b-bc0c-9642c5d00841"],
          id: "f4e947cb-72b6-4565-9cc7-6020ee09d920",
          providers: [
            {
              config: {
                expo: {
                  subtitle: "Subtitle",
                  title: "Title",
                },
              },
              configurationId: "f4e947cb-72b6-4565-9cc7-6020ee09d920",
              key: "expo",
            },
          ],
          taxonomy: "push:expo",
        },
      ],
    },
    __legacy__strategy__id__: "6400e943-54ae-4942-8394-67f939590999",
  },
  objtype: "event",
  title: "Test Notification",
};
