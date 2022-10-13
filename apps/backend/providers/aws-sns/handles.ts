import { HandlesFn } from "../types";

const handles: HandlesFn = ({
  config,
  profile,
}: {
  config: any;
  profile: any;
}) =>
  !!profile?.phone_number ||
  !!profile?.aws_sns?.target_arn ||
  !!config?.json?.topicArn;

export default handles;
