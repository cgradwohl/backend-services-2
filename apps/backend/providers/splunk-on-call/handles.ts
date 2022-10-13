import { HandlesFn } from "../types";

const handles: HandlesFn = ({ profile }) => {
  if (!profile.splunk_on_call) {
    return false;
  }

  if (typeof profile.splunk_on_call !== "object") {
    return false;
  }

  const { splunk_on_call: splunkOnCall } = profile as any;

  if (splunkOnCall.target) {
    return (
      typeof splunkOnCall.target.type === "string" &&
      splunkOnCall.target.type.length > 0 &&
      typeof splunkOnCall.target.slug === "string" &&
      splunkOnCall.target.slug.length > 0
    );
  } else {
    return false;
  }
};

export default handles;
