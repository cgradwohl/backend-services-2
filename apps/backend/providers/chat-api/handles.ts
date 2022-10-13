import { HandlesFn } from "../types";

const handles: HandlesFn = ({ profile }) => {
  if (!profile.chat_api) {
    return false;
  }

  if (typeof profile.chat_api !== "object") {
    return false;
  }

  const { chat_api: chatApi } = profile as any;

  if (chatApi) {
    return (
      (typeof chatApi.phone_number === "string" &&
        chatApi.phone_number.length > 0) ||
      (typeof chatApi.chat_id === "string" && chatApi.chat_id.length > 0)
    );
  } else {
    return false;
  }
};

export default handles;
