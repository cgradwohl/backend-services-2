import axios from "axios";

const stagingUrl =
  "https://yubmnstah4.execute-api.us-east-1.amazonaws.com/staging";

const getBaseUrl = () => {
  if (process.env.STAGE === "production") {
    return process.env.API_URL;
  }

  if (process.env.STAGE === "dev") {
    return process.env.API_URL;
  }

  return stagingUrl;
};

export default (
  apiKey?: string,
  headers?: {
    [key: string]: string;
  }
) => {
  const url = getBaseUrl();

  const config = {
    headers: {
      Authorization: `Bearer ${apiKey ?? process.env.COURIER_AUTH_TOKEN}`,
      ...headers,
    },
  };

  return {
    post: (path: string, data?: any) => {
      return axios.post(`${url}${path}`, data, config);
    },
  };
};
