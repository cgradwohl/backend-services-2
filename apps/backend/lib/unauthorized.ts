/** Throws Unauthorized error compatible with APIGatewayRequestAuthorizer */
export const unauthorized = () => {
  throw new Error("Unauthorized");
};
