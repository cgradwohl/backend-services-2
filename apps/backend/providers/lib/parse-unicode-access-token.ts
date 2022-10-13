//Putting this in its own file in case we need/want to reuse it for other access tokens ( currently only in Slack ) or if it needs to be more complex later
const parseUnicodeFromAccessToken = (token: string): string => {
  return token.replace(/[^ -~]+/g, "");
};

export default parseUnicodeFromAccessToken;
