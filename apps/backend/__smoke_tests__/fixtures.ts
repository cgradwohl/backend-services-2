const _emailEvents = (() => {
  if (process.env.SMOKE_TEST_EVENT) {
    return [process.env.SMOKE_TEST_EVENT];
  }

  if (process.env.STAGE === "staging") {
    return ["SAPBJ1JWR44V2MQ3NBRFRVAC594W"];
  }
  if (process.env.STAGE === "production") {
    return ["14171CNHXG4JHXNH2NRMBYJ0Y20P"];
  }

  return [];
})();

export const emailEvents = _emailEvents;
