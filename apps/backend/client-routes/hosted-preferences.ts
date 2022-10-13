import getEnvVar from "~/lib/get-environment-variable";
import { handleRaw } from "~/lib/lambda-response";

const getBody = ([apiUrl, brandId, clientKey, userId]) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>Manage Notification Preferences</title>
      <style>
        body {
          cursor: default;
          font-family: "Nunito Sans", sans-serif;
          margin: 0;
          padding: 32px;
        }
        #root {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        #test {
          width: 615px;
        }
      </style>
    </head>
    <body>
      <div id="root">
        <noscript>JavaScript is required.</noscript>
        <h1>Manage Your Notification Preferences</h1>
        <div id="test">
          <courier-preference-page />
        </div>
        <div id="root" />
        <script type="text/javascript">
          window.courierConfig = {
            apiUrl: "${apiUrl}",
            brandId: "${brandId}",
            clientKey: "${clientKey}",
            userId: "${userId}",
          }
        </script>
        <script src="https://courier-components-xvdza5.s3.amazonaws.com/latest.js"></script>
      </div>
    </body>
  </html>`;

export const handle = handleRaw(async ({ event }) => {
  const [workspaceId, brandId, userId] = Buffer.from(
    event["pathParameters"].encodedId,
    "base64"
  )
    .toString()
    .split("/");

  const apiUrl = `${getEnvVar("API_URL")}/client/q`;

  const body = getBody([
    apiUrl,
    brandId,
    Buffer.from(workspaceId).toString("base64"),
    userId,
  ]);

  return {
    body,
    headers: {
      "Access-Control-Allow-Credentials": undefined,
      "Access-Control-Allow-Origin": undefined,
      "Content-Type": "text/html",
    },
    status: 200,
    transform: (value) => value, // To prevent stringifying HTML content
  };
});
