/*
Example:
Self=1-67891234-12456789abcdef012345678;Root=1-67891233-abcdef012345678912345678;CalledFrom=app

Via:
https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-request-tracing.html
*/

export type AmznTraceId = {
  root: string;
  self?: string;
  calledFrom?: string;
};

const parseAmznTraceId = (traceId: string): AmznTraceId => {
  const map = new Map<string, string>(
    traceId.split(";").map((pair) => {
      const [k, v] = pair.split("=");
      return [k, v];
    })
  );

  return {
    root: map.get("Root"),
    self: map.get("Self"),
    calledFrom: map.get("CalledFrom"),
  };
};

export default parseAmznTraceId;
